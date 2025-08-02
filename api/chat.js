import { useState } from "react";

/**
 * useChat hook:
 * - Manages local chat history
 * - Sends full message history to the proxy API to preserve context
 */
export function useChat(sessionId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Sends a new user message along with the full conversation history
   * to the proxy API, then appends the assistant's reply.
   */
  const sendMessage = async (text) => {
    if (!sessionId || !text) return;
    setLoading(true);

    // Build new history including the user message
    const updatedHistory = [...messages, { role: 'user', content: text }];
    setMessages(updatedHistory);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, messages: updatedHistory }),
      });
      if (!res.ok) {
        throw new Error(`API error ${res.status}`);
      }

      const { reply } = await res.json();
      if (reply) {
        // Append assistant reply to conversation
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      }
    } catch (err) {
      console.error('Error during sendMessage:', err);
    } finally {
      setLoading(false);
    }
  };

  return { messages, sendMessage, loading };
}
