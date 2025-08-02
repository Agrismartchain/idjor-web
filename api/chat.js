// pages/api/chat.js

/**
 * Simplified proxy API route forwarding messages to Ollama.
 * No streaming—returns full reply JSON.
 *
 * Environment variables required:
 *   - CHATBOT_URL       (ngrok or custom domain)
 *   - CHATBOT_MODEL     (optional, default: 'llama2:latest')
 *   - SUPABASE_URL      (optional, for persistence)
 *   - SUPABASE_ANON_KEY (optional, for persistence)
 */
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// Initialize Supabase client if configured
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { sessionId, message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Missing message in request body' });
  }

  const API_URL = process.env.CHATBOT_URL;
  const MODEL   = process.env.CHATBOT_MODEL || 'llama2:latest';
  if (!API_URL) {
    return res.status(500).json({ error: 'CHATBOT_URL not set' });
  }

  // Persist user message (fire & forget)
  if (supabase && sessionId) {
    supabase.from('chats').insert([
      { session_id: sessionId, role: 'user', content: message }
    ]).catch(err => console.error('Supabase user insert error:', err));
  }

  try {
    // Forward to Ollama and get full response
    const extRes = await fetch(
      `${API_URL}/v1/chat/completions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: message }] }),
      }
    );

    if (!extRes.ok) {
      const errText = await extRes.text();
      console.error('Ollama proxy error:', extRes.status, errText);
      return res.status(extRes.status).json({ error: errText });
    }

    const data = await extRes.json();
    const reply = data.choices?.[0]?.message?.content || '';

    // Persist bot reply (fire & forget)
    if (supabase && sessionId) {
      supabase.from('chats').insert([
        { session_id: sessionId, role: 'assistant', content: reply }
      ]).catch(err => console.error('Supabase bot insert error:', err));
    }

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Error in proxy handler:', err);
    return res.status(500).json({ error: 'Proxy error' });
  }
}
