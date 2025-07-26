import { useState } from "react";

export function useChat() {
  const [messages, setMessages] = useState([
    { role: "bot", content: "Bonjour ! Écris un message ci‑dessous…" },
  ]);
  const [loading, setLoading] = useState(false);

  async function sendMessage(userText) {
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: userText }]);

    try {
      // src/useChat.js
const res = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: userText }),
});

      if (!res.ok) throw new Error(`Status ${res.status}`);
      const { reply } = await res.json();
      setMessages((prev) => [...prev, { role: "bot", content: reply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Erreur de connexion au serveur." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return { messages, sendMessage, loading };
}
