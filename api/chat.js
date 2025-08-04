// pages/api/chat.js

/**
 * Proxy API route to forward chat requests to the Ollama service via your ngrok tunnel or custom domain.
 *
 * Environment variable expected:
 *   - CHATBOT_URL: base URL of the external chat API (e.g., your ngrok tunnel)
 *   - (optional) CHATBOT_MODEL: model name, default 'llama2:latest'
 */
export default async function handler(req, res) {
  const API_URL = process.env.CHATBOT_URL;
  const MODEL = process.env.CHATBOT_MODEL || 'llama2:latest';
  if (!API_URL) {
    return res.status(500).json({ error: 'Missing CHATBOT_URL environment variable' });
  }

  // GET: return empty history (we'll manage history client-side)
  if (req.method === 'GET') {
    return res.status(200).json({ history: [] });
  }

  // POST: send chat completion request to Ollama
  if (req.method === 'POST') {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }
    try {
      const payload = {
        model: MODEL,
        messages: [
          { role: 'user', content: message }
        ]
      };
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
        console.error('External API error', extRes.status, errText);
        return res.status(extRes.status).json({ error: errText });
      }
      const data = await extRes.json();
      // extract assistant reply
      const reply = data.choices?.[0]?.message?.content || '';
      return res.status(200).json({ reply });
    } catch (err) {
      console.error('Error sending chat message:', err);
      return res.status(500).json({ error: 'Error sending chat message' });
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
