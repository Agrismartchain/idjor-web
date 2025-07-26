// api/chat.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end(); // Method Not Allowed
  }
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  // ton token injecté par Vercel
  const HF_TOKEN = process.env.HF_TOKEN;
  if (!HF_TOKEN) {
    return res.status(500).json({ error: "HF_TOKEN not set" });
  }

  // Appel à l’API Inference
  const apiRes = await fetch(
    "https://api-inference.huggingface.co/models/google/flan-t5-small",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: message }),
    }
  );

  if (!apiRes.ok) {
    const text = await apiRes.text();
    console.error("HF error", apiRes.status, text);
    return res.status(apiRes.status).json({ error: text });
  }

  const data = await apiRes.json();
  // Pour flan-t5-small, la réponse se trouve dans data[0].generated_text
  const reply = data[0]?.generated_text ?? "…";

  return res.status(200).json({ reply });
}
