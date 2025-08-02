// pages/api/chat.js

/**
 * Proxy API route to forward chat requests to the Ollama service via your ngrok tunnel or custom domain.
 *
 * Environment variable expected:
 *   - CHATBOT_URL: base URL of the external chat API (e.g., your ngrok tunnel)
 */
export default async function handler(req, res) {
  // Retrieve base URL from environment (should not be exposed client-side)
  const API_URL = process.env.CHATBOT_URL;
  if (!API_URL) {
    return res.status(500).json({ error: 'Missing CHATBOT_URL environment variable' });
  }

  // Handle GET for chat history
  if (req.method === 'GET') {
    const { sessionId } = req.query;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId query parameter is required' });
    }
    try {
      const extRes = await fetch(
        `${API_URL}/v1/chat/history?sessionId=${encodeURIComponent(sessionId)}`
      );
      const data = await extRes.json();
      return res.status(extRes.status).json({ history: data.history || [] });
    } catch (err) {
      console.error('Error fetching chat history:', err);
      return res.status(500).json({ error: 'Error fetching chat history' });
    }
  }

  // Handle POST for sending a new chat message
  if (req.method === 'POST') {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'sessionId and message are required in the body' });
    }
    try {
      const extRes = await fetch(
        `${API_URL}/v1/chat/completions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, message }),
        }
      );
      const data = await extRes.json();
      return res.status(extRes.status).json({ history: data.history || [] });
    } catch (err) {
      console.error('Error sending chat message:', err);
      return res.status(500).json({ error: 'Error sending chat message' });
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
