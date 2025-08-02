// pages/api/chat.js

/**
 * Enhanced proxy API route forwarding full conversation to Ollama with context.
 *
 * Required environment variables:
 *   - CHATBOT_URL         (ngrok tunnel or custom domain)
 *   - CHATBOT_MODEL       (optional, default: 'llama2:latest')
 *   - CHATBOT_SYSTEM_MSG  (optional, default system prompt)
 */
export default async function handler(req, res) {
  // Only POST is allowed
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { sessionId, messages } = req.body;
  // messages: array of { role, content }
  if (!sessionId || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Request must include sessionId and non-empty messages array' });
  }

  const API_URL = process.env.CHATBOT_URL;
  if (!API_URL) {
    console.error('CHATBOT_URL not set');
    return res.status(500).json({ error: 'Server misconfiguration: CHATBOT_URL missing' });
  }
  const MODEL       = process.env.CHATBOT_MODEL || 'llama2:latest';
  const SYSTEM_MSG  = process.env.CHATBOT_SYSTEM_MSG || 'You are an AI assistant specialized in agriculture. Provide concise, context-aware answers.';

  // Build full prompt sequence: system + history + latest user message
  const payloadMessages = [
    { role: 'system', content: SYSTEM_MSG },
    ...messages
  ];

  try {
    // Forward to Ollama with full context
    const response = await fetch(
      `${API_URL.replace(/\/+$/,'')}/v1/chat/completions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, messages: payloadMessages }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Ollama proxy error:', response.status, errText);
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '';

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Proxy handler exception:', err);
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
