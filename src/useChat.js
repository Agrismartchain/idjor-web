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
      const res = await fetch(
  "https://hf.space/embed/WakamaFarm/idjor-chat/+/api/predict",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [userText] }),
  }
);

      const json = await res.json();
      const botReply = json.data?.[0] || "Désolé, je n'ai pas compris.";
      setMessages((prev) => [...prev, { role: "bot", content: botReply }]);
    } catch {
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
