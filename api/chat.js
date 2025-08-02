// pages/api/chat.js

/**
 * Proxy API route with Supabase persistence and Ollama integration.
 *
 * Environment variables expected:
 *   - SUPABASE_URL
 *   - SUPABASE_ANON_KEY
 *   - CHATBOT_URL
 *   - CHATBOT_MODEL (optional): default 'llama2:latest'
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

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { sessionId, message } = req.body;
  if (!sessionId || !message) {
    return res.status(400).json({ error: 'sessionId and message are required in the body' });
  }

  // Persist user message
  try {
    await supabase
      .from('chats')
      .insert([{ session_id: sessionId, role: 'user', content: message }]);
  } catch (dbErr) {
    console.error('Error inserting user message into Supabase:', dbErr);
    // Continue even if persistence fails
  }

  let reply = '';
  try {
    // Call external chat completions endpoint
    const payload = {
      model: MODEL,
      messages: [{ role: 'user', content: message }],
    };
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
      console.error('External API error', extRes.status, errText);
      return res.status(extRes.status).json({ error: errText });
    }

    const data = await extRes.json();
    reply = data.choices?.[0]?.message?.content || '';
  } catch (err) {
    console.error('Error calling chat API:', err);
    return res.status(500).json({ error: 'Error calling chat API' });
  }

  // Persist assistant reply
  try {
    await supabase
      .from('chats')
      .insert([{ session_id: sessionId, role: 'assistant', content: reply }]);
  } catch (dbErr) {
    console.error('Error inserting assistant message into Supabase:', dbErr);
  }

  return res.status(200).json({ reply });
}
