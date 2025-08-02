// pages/api/chat.js

/**
 * Proxy API route with Ollama streaming SSE and Supabase persistence.
 *
 * Environment variables (via Vercel):
 *   - CHATBOT_URL        (required)  ngrok tunnel or custom domain
 *   - SUPABASE_URL       (optional)  for persisting chat history
 *   - SUPABASE_ANON_KEY  (optional)  to initialize Supabase
 *   - CHATBOT_MODEL      (optional)  default 'llama2:latest'
 */
import { createClient } from '@supabase/supabase-js';

// Disable body parsing so we can handle SSE
export const config = { api: { bodyParser: false } };

// Initialize Supabase client if configured
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

  // Manually parse raw body
  let raw = '';
  for await (const chunk of req) raw += chunk;
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { sessionId, message } = body;
  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  // Persist user message if Supabase enabled
  if (supabase && sessionId) {
    supabase.from('chats').insert({ session_id: sessionId, role: 'user', content: message })
      .catch(err => console.error('Supabase insert user error', err));
  }

  const API_URL = process.env.CHATBOT_URL;
  const MODEL   = process.env.CHATBOT_MODEL || 'llama2:latest';
  if (!API_URL) {
    return res.status(500).json({ error: 'Missing CHATBOT_URL environment variable' });
  }

  try {
    // Call Ollama with streaming
    const extRes = await fetch(
      `${API_URL}/v1/chat/completions?stream=true`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: message }], stream: true })
      }
    );
    if (!extRes.ok) {
      const errText = await extRes.text();
      console.error('Ollama API error', extRes.status, errText);
      return res.status(extRes.status).json({ error: errText });
    }

    // Setup SSE response
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    });

    const reader = extRes.body.getReader();
    const decoder = new TextDecoder();
    // Stream chunks to client
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      // Forward SSE chunk as-is
      res.write(chunk);
    }

    // End of stream
    res.write('\n\n');
    res.end();

  } catch (err) {
    console.error('Error during streaming:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Streaming error' });
    } else {
      res.end();
    }
  }
}
