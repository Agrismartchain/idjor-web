import { useState, useEffect } from "react";

/**
 * useChat hook:
 * - GET /v1/chat/history?sessionId= to load the history
 * - POST /v1/chat/completions with { sessionId, message } to send a new message and get updated history
 */
export function useChat(sessionId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  // Base URL de l'API pointant vers ton tunnel ngrok
  const API_URL = process.env.NEXT_PUBLIC_CHATBOT_URL || "";

  // 1) Charger l’historique via GET
  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    fetch(
      `${API_URL}/v1/chat/history?sessionId=${encodeURIComponent(
        sessionId
      )}`
    )
      .then((res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        return res.json();
      })
      .then((data) => setMessages(data.history || []))
      .catch((err) => console.error("Error loading chat history:", err))
      .finally(() => setLoading(false));
  }, [sessionId]);

  // 2) Envoyer un message via POST
  const sendMessage = async (text) => {
    if (!sessionId) {
      console.warn("sendMessage appelé sans sessionId");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/chat/completions`, {
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
