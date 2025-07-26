// api/chat.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    const hfRes = await fetch(
      "https://api-inference.huggingface.co/models/google/flan-t5-small",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: message }),
      }
    );
    if (!hfRes.ok) throw new Error(`HF ${hfRes.status}`);
    const data = await hfRes.json();
    // flan-t5-small renvoie un array de générés :
    const reply =
      (data[0] && data[0].generated_text) || data.generated_text || "";
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("❌ /api/chat error:", err);
    return res.status(500).json({ error: "Inference failed" });
  }
}
