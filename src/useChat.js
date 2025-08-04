import { useState } from "react";

/**
 * useChat hook:
 * Manages chat messages locally and sends user messages with context to the proxy API.
 */
export function useChat(sessionId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const MAX_HISTORY = 20; // Number of last messages to include in context

  /**
   * Sends a message along with recent conversation history,
   * then appends the assistant's reply to local state.
   */
  const sendMessage = async (text) => {
    if (!sessionId || !text) return;
    setLoading(true);

    // 1) Add user message locally
    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);

    // 2) Prepare limited history payload
    const recentHistory = [...messages, userMsg].slice(-MAX_HISTORY);
    const payload = { sessionId, messages: recentHistory };

    // 3) Call proxy API
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);

      // 4) Handle reply
      const { reply } = await res.json();
      if (reply) {
        const botMsg = { role: 'assistant', content: reply };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  return { messages, sendMessage, loading };
}
