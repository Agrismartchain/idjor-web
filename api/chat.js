// pages/api/chat.js

/**
 * Proxy API route with Ollama integration and Supabase persistence.
 *
 * Environment variables (via Vercel):
 *   - CHATBOT_URL         (required) ngrok tunnel or custom domain
 *   - CHATBOT_MODEL       (optional) default 'llama2:latest'
 *   - SUPABASE_URL        (optional) for persisting chat
 *   - SUPABASE_ANON_KEY   (optional) to initialize Supabase
 */
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client only if both URL and key are provided
const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
    : null;

// Increase body size limit if history grows
export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { sessionId, message } = req.body;
  if (!sessionId || !message) {
    return res
      .status(400)
      .json({ error: 'Request body must include sessionId and message' });
  }

  const API_URL = process.env.CHATBOT_URL;
  const MODEL   = process.env.CHATBOT_MODEL || 'llama2:latest';
  if (!API_URL) {
    return res
      .status(500)
      .json({ error: 'Missing CHATBOT_URL environment variable' });
  }

  let history = [];
  // 1) Fetch previous messages from Supabase for context
  if (supabase) {
    try {
      const { data: rows, error } = await supabase
        .from('chats')
        .select('role, content')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      if (error) {
        console.error('Supabase fetch error:', error);
      } else {
        history = rows.map(({ role, content }) => ({ role, content }));
      }
    } catch (err) {
      console.error('Error reading history from Supabase:', err);
    }
  }

  // Append current user message to history
  history.push({ role: 'user', content: message });

  // 2) Call Ollama chat completion endpoint with full history
  let reply = '';
  try {
    const payload = { model: MODEL, messages: history };
    const extRes = await fetch(
      `${API_URL}/v1/chat/completions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
    console.error('Error calling chat API:', err);
    return res.status(500).json({ error: 'Error calling chat API' });
  }

  // 3) Persist messages: user and assistant
  if (supabase) {
    supabase
      .from('chats')
      .insert([
        { session_id: sessionId, role: 'user',      content: message },
        { session_id: sessionId, role: 'assistant', content: reply   }
      ])
      .catch((dbErr) => console.error('Supabase insert error:', dbErr));
  }

  // 4) Return the assistant's reply
  return res.status(200).json({ reply });
}
