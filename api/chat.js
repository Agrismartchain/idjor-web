// pages/api/chat.js

/**
 * Proxy API route supporting streaming SSE to Ollama with context.
 *
 * Required environment variables:
 *   - CHATBOT_URL        (ngrok or custom domain)
 *   - CHATBOT_MODEL      (optional, default 'mistral-v0.3')
 *   - CHATBOT_SYSTEM_MSG (optional, default system prompt)
 *   - CHATBOT_MAX_HISTORY (optional, default 20)
 */
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Read raw body
  let raw = '';
  for await (const chunk of req) raw += chunk;
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { sessionId, messages } = body;
  if (!sessionId || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing sessionId or messages array' });
  }

  const API_URL       = process.env.CHATBOT_URL;
  const MODEL         = process.env.CHATBOT_MODEL || 'mistral-v0.3';
  const SYSTEM_MSG    = process.env.CHATBOT_SYSTEM_MSG || 'You are an AI assistant specialized in agriculture.';
  const MAX_HISTORY   = parseInt(process.env.CHATBOT_MAX_HISTORY) || 20;

  if (!API_URL) {
    return res.status(500).json({ error: 'CHATBOT_URL not set' });
  }

  // Prepare context: system + recent user/bot messages
  const recent = messages.slice(-MAX_HISTORY);
  const payload = {
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_MSG },
      ...recent
    ],
    stream: true
  };

  // Call Ollama streaming endpoint
  let extRes;
  try {
    extRes = await fetch(
      `${API_URL.replace(/\/+$/,'')}/v1/chat/completions?stream=true`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );
  } catch (err) {
    console.error('Error calling Ollama:', err);
    return res.status(500).json({ error: 'Error calling chat API' });
  }

  if (!extRes.ok) {
    const errText = await extRes.text();
    console.error('Ollama proxy error:', extRes.status, errText);
    return res.status(extRes.status).json({ error: errText });
  }

  // Stream SSE back to client
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive'
  });

  const reader = extRes.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    res.write(chunk);
  }
  // End of stream
  res.write('\n\n');
  res.end();
}
