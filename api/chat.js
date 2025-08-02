// pages/api/chat.js

/**
 * Simple proxy API route forwarding messages to Ollama.
 *
 * Required environment variables:
 *   - CHATBOT_URL   (ngrok tunnel or custom domain)
 *   - CHATBOT_MODEL (optional, default: 'llama2:latest')
 */
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Missing parameter: message' });
  }

  const API_URL = process.env.CHATBOT_URL;
  if (!API_URL) {
    console.error('CHATBOT_URL not set');
    return res.status(500).json({ error: 'Server misconfiguration: CHATBOT_URL missing' });
  }
  const MODEL = process.env.CHATBOT_MODEL || 'llama2:latest';

  try {
    // Forward to Ollama
    const response = await fetch(
      `${API_URL.replace(/\/+$/,'')}/v1/chat/completions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: message }] }),
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
