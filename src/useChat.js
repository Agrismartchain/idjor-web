import { useState } from "react";

/**
 * useChat hook:
 * Manages chat messages locally and sends user messages with context to the proxy API.
 */
export function useChat(sessionId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const MAX_HISTORY = 20; // Number of last messages to include

  /**
   * Sends a message along with recent conversation history,
   * then streams back the assistant's reply token-by-token.
   */
  const sendMessage = async (text) => {
    if (!sessionId || !text) return;
    setLoading(true);

    // Add user message locally
    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);

    // Prepare limited history payload
    const history = [...messages, userMsg].slice(-MAX_HISTORY);
    const payload = { sessionId, messages: history };

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);

      // Create placeholder for assistant reply
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      const assistantIndex = messages.length + 1;

      // Stream response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulated = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value);
          accumulated += chunk;
          // Update last assistant message with streamed content
          setMessages((prev) => {
            const updated = [...prev];
            updated[assistantIndex] = { role: 'assistant', content: accumulated };
            return updated;
          });
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  return { messages, sendMessage, loading };
}

