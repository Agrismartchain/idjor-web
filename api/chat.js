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

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Parse incoming JSON body
  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }
  const { message } = JSON.parse(body);
  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
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
        body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: message }], stream: true }),
      }
    );
    if (!extRes.ok) {
      const errText = await extRes.text();
      console.error('Ollama API error', extRes.status, errText);
      return res.status(extRes.status).json({ error: errText });
    }

    // Set up SSE stream to client
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });

    const reader = extRes.body.getReader();
    const decoder = new TextDecoder();

    // Pipe chunks to client
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      // Forward the raw SSE chunks from Ollama
      res.write(chunk);
    }

    // Signal end of stream
    res.write('
');
    res.end();
  } catch (err) {
    console.error('Error during streaming:', err);
    return res.status(500).json({ error: 'Streaming error' });
  }
}
