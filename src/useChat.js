import { useState, useEffect } from "react";

/**
 * useChat hook:
 * - GET /api/chat?sessionId= to load the history
 * - POST /api/chat with { sessionId, message } to send a new message and get updated history
 */
export function useChat(sessionId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1) Charger l’historique via GET sur la fonction proxy
  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    fetch(
      `/api/chat?sessionId=${encodeURIComponent(sessionId)}`
    )
      .then((res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        return res.json();
      })
      .then((data) => setMessages(data.history || []))
      .catch((err) => console.error("Error loading chat history:", err))
      .finally(() => setLoading(false));
  }, [sessionId]);

  // 2) Envoyer un message via POST sur la fonction proxy
  const sendMessage = async (text) => {
    if (!sessionId) {
      console.warn("sendMessage appelé sans sessionId");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const { history } = await res.json();
      setMessages(history || []);
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setLoading(false);
    }
  };

  return { messages, sendMessage, loading };
}
