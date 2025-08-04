import { useState } from "react";

/**
 * useChat hook:
 * Manages chat messages locally and sends user messages to the proxy API.
 * GET history is not used; chat history is managed client-side.
 */
export function useChat(sessionId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  /** Sends a message and appends both user and assistant replies to messages */
  const sendMessage = async (text) => {
    if (!sessionId || !text) return;
    setLoading(true);

    // Add user message locally
    setMessages((prev) => [...prev, { role: 'user', content: text }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);

      // Extract reply from proxy
      const { reply } = await res.json();
      if (reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  return { messages, sendMessage, loading };
}

