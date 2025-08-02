// pages/api/chat.js

/**
 * Proxy API route with Ollama integration and Supabase persistence.
 *
 * Environment variables (via Vercel):
 *   - CHATBOT_URL        (required)  ngrok tunnel or custom domain
 *   - SUPABASE_URL       (required)  URL of your Supabase instance
 *   - SUPABASE_ANON_KEY  (required)  Supabase anon/public key
 *   - CHATBOT_MODEL      (optional)  default 'llama2:latest'
 */
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Increase body size limit if history grows
export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { sessionId, message } = req.body;
  if (!sessionId || !message) {
    return res.status(400).json({ error: 'sessionId and message are required in the body' });
  }

  const API_URL = process.env.CHATBOT_URL;
  const MODEL   = process.env.CHATBOT_MODEL || 'llama2:latest';
  if (!API_URL) {
    return res.status(500).json({ error: 'Missing CHATBOT_URL environment variable' });
  }

  // 1) Persist the user message in Supabase
  try {
    await supabase
      .from('chats')
      .insert({ session_id: sessionId, role: 'user', content: message });
  } catch (dbError) {
    console.error('Error inserting user message:', dbError);
  }

  // 2) Call Ollama chat completion endpoint
  let reply = '';
  try {
    const payload = { model: MODEL, messages: [{ role: 'user', content: message }] };
    const extRes = await fetch(
      `${API_URL}/v1/chat/completions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );
    if (!extRes.ok) {
      const errorText = await extRes.text();
      console.error('Ollama API error', extRes.status, errorText);
      return res.status(extRes.status).json({ error: errorText });
    }
    const data = await extRes.json();
    reply = data.choices?.[0]?.message?.content || '';
  } catch (err) {
    console.error('Error calling chat API:', err);
    return res.status(500).json({ error: 'Error calling chat API' });
  }

  // 3) Persist the assistant reply in Supabase
  try {
    await supabase
      .from('chats')
      .insert({ session_id: sessionId, role: 'assistant', content: reply });
  } catch (dbError) {
    console.error('Error inserting assistant reply:', dbError);
  }

  // 4) Return the assistant's reply
  return res.status(200).json({ reply });
}
