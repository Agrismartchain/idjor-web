// pages/api/chat.js

/**
 * Proxy API route with Supabase-backed history and Ollama integration.
 *
 * Environment variables:
 *   - SUPABASE_URL
 *   - SUPABASE_ANON_KEY
 *   - CHATBOT_URL
 *   - CHATBOT_MODEL (optional, default 'llama2:latest')
 */
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const API_URL = process.env.CHATBOT_URL;
  const MODEL = process.env.CHATBOT_MODEL || 'llama2:latest';

  if (!API_URL) {
    return res.status(500).json({ error: 'Missing CHATBOT_URL environment variable' });
  }

  // GET: fetch chat history from Supabase
  if (req.method === 'GET') {
    const { sessionId } = req.query;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId query parameter is required' });
    }
    const { data, error } = await supabase
      .from('chats')
      .select('role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Supabase fetch error', error);
      return res.status(500).json({ error: error.message });
    }
    // Return only role and content
    const history = data.map(({ role, content }) => ({ role, content }));
    return res.status(200).json({ history });
  }

  // POST: store user message, call Ollama, store assistant reply
  if (req.method === 'POST') {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'sessionId and message are required in the body' });
    }

    // Insert user message into Supabase
    const { error: userError } = await supabase
      .from('chats')
      .insert({ session_id: sessionId, role: 'user', content: message });
    if (userError) console.error('Supabase insert user error', userError);

    let reply = '';
    try {
      // Build payload for Ollama
      const payload = { model: MODEL, messages: [{ role: 'user', content: message }] };
      const extRes = await fetch(
        `${API_URL}/v1/chat/completions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!extRes.ok) {
        const errText = await extRes.text();
        console.error('Ollama API error', extRes.status, errText);
        return res.status(extRes.status).json({ error: errText });
      }
      const data = await extRes.json();
      reply = data.choices?.[0]?.message?.content || '';
    } catch (err) {
      console.error('Error calling Ollama:', err);
      return res.status(500).json({ error: 'Error calling chat API' });
    }

    // Insert assistant reply into Supabase
    const { error: botError } = await supabase
      .from('chats')
      .insert({ session_id: sessionId, role: 'assistant', content: reply });
    if (botError) console.error('Supabase insert assistant error', botError);

    return res.status(200).json({ reply });
  }

  // Method Not Allowed
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
