import { useState, useEffect } from "react";

const STORAGE_KEY = "chat_messages_map";

export function useChat(sessionId) {
  // Initialize messagesMap from localStorage
  const [messagesMap, setMessagesMap] = useState(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [loading, setLoading] = useState(false);

  // Persist messagesMap to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messagesMap));
    } catch {
      // ignore
    }
  }, [messagesMap]);

  const messages = messagesMap[sessionId] || [];

  const updateSession = (id, newMessages) => {
    setMessagesMap((prev) => ({ ...prev, [id]: newMessages }));
  };

  const sendMessage = async (text) => {
    setLoading(true);
    const userMsg = { role: "user", content: text };
    const history = [...messages, userMsg];
    updateSession(sessionId, history);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error("Erreur API chat");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let botContent = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        botContent += decoder.decode(value || new Uint8Array(), { stream: true });
      }

      let reply = botContent;
      try {
        const data = JSON.parse(botContent);
        if (data.reply) reply = data.reply;
      } catch {
        // keep raw content
      }

      const botMsg = { role: "bot", content: reply };
      updateSession(sessionId, [...history, botMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    updateSession(sessionId, []);
  };

  return { messages, sendMessage, loading, reset };
}
