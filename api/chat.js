// pages/api/chat.js

// Proxy API route to forward chat requests to the Ollama service via your ngrok tunnel
export default async function handler(req, res) {
  // Base URL de l’API (tunnel ngrok ou custom domain)
  const API_URL = process.env.NEXT_PUBLIC_CHATBOT_URL;
  if (!API_URL) {
    return res.status(500).json({ error: 'Missing NEXT_PUBLIC_CHATBOT_URL environment variable' });
  }

  // GET /api/chat?sessionId=... -> history
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

  // POST /api/chat with { sessionId, message } -> complete
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

  // Method Not Allowed
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
