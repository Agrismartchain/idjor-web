import { useState } from "react";

export function useChat() {
  const [messages, setMessages] = useState([
    { role: "bot", content: "Bonjour ! Écris un message ci‑dessous…" },
  ]);
  const [loading, setLoading] = useState(false);

  async function sendMessage(userText) {
    setLoading(true);
    // On ajoute immédiatement le message utilisateur
    setMessages((prev) => [...prev, { role: "user", content: userText }]);

    try {
      // Appelle l'API Hugging Face Space
      const res = await fetch(
        "https://hf.space/embed/WakamaFarm/idjor-chat/api/predict/", 
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: [userText] }),
        }
      );
      const json = await res.json();
      // La réponse est dans json.data[0]
      const botReply = json.data?.[0] || "Désolé, je n'ai pas compris.";

      setMessages((prev) => [...prev, { role: "bot", content: botReply }]);
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
