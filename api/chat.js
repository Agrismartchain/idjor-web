// api/chat.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "No message provided" });

  const HF_TOKEN = process.env.HF_TOKEN;
  if (!HF_TOKEN) {
    console.error("Missing HF_TOKEN");
    return res.status(500).json({ error: "HF_TOKEN not set" });
  }

  let hfRes;
  try {
    hfRes = await fetch(
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
  } catch (e) {
    console.error("Fetch error:", e);
    return res
      .status(502)
      .json({ error: "Bad gateway calling HF API", details: e.message });
  }

  if (!hfRes.ok) {
    const text = await hfRes.text();
    console.error("HF API error", hfRes.status, text);
    return res.status(hfRes.status).json({ error: text });
  }

  let data;
  try {
    data = await hfRes.json();
  } catch (e) {
    console.error("Invalid JSON from HF API:", e);
    return res.status(502).json({ error: "Invalid JSON from HF" });
  }

  const reply = data[0]?.generated_text?.trim() ?? "…";
  return res.status(200).json({ reply });
}
