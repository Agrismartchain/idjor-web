// api/chat.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { message } = req.body;
  try {
    const hfRes = await fetch(
      "https://api-inference.huggingface.co/models/gpt2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: message }),
      }
    );
    const json = await hfRes.json();
    const reply = Array.isArray(json)
      ? json[0].generated_text
      : json.generated_text;
    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "backend_error" });
  }
}
