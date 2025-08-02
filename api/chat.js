// pages/api/chat.js

/**
 * Proxy API route with Ollama integration and optional Supabase persistence.
 *
 * Environment variables:
 *   - CHATBOT_URL: base URL of the external chat API (e.g., your ngrok tunnel)
 *   - CHATBOT_MODEL (optional): model name, default 'llama2:latest'
 *   - SUPABASE_URL (optional): if set, enables persistence
 *   - SUPABASE_ANON_KEY (optional): required if SUPABASE_URL is set
 */
import { createClient } from '@supabase/supabase-js';

// Conditionally initialize Supabase only if env vars provided
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { sessionId, message } = req.body;
  if (!sessionId || !message) {
    return res.status(400).json({ error: 'sessionId and message are required' });
  }

  const API_URL = process.env.CHATBOT_URL;
  const MODEL   = process.env.CHATBOT_MODEL || 'llama2:latest';
  if (!API_URL) {
    return res.status(500).json({ error: 'Missing CHATBOT_URL environment variable' });
  }

  // 1. Call external chat completions endpoint
  let reply = '';
  try {
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
    console.error('Error calling chat API:', err);
    return res.status(500).json({ error: 'Error calling chat API' });
  }

  // 2. Persist to Supabase if enabled (fire-and-forget)
  if (supabase) {
    (async () => {
      try {
        await supabase.from('chats').insert([
          { session_id: sessionId, role: 'user',      content: message },
          { session_id: sessionId, role: 'assistant', content: reply   }
        ]);
      } catch (dbErr) {
        console.error('Supabase persistence error:', dbErr);
      }
    })();
  }

  // 3. Return reply
  return res.status(200).json({ reply });
}
