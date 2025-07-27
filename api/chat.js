// api/chat.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "No message provided" });

  // 1) Lancement de l'inférence : on POST et on récupère event_id
  const postRes = await fetch(
    "https://wakamafarm-flan-t5-small-inference.hf.space/gradio_api/call/predict",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [message], fn_index: 0 })
    }
  );
  const postJson = await postRes.json();
  const eventId = postJson.event_id;
  if (!eventId) {
    console.error("No event_id returned:", postJson);
    return res.status(500).json({ error: "No event_id returned" });
  }

  // 2) Lecture du flux SSE pour récupérer la réponse complète
  const streamRes = await fetch(
    `https://wakamafarm-flan-t5-small-inference.hf.space/gradio_api/call/predict/${eventId}`,
    { headers: { Accept: "text/event-stream" } }
  );
  if (!streamRes.ok) {
    const errText = await streamRes.text();
    console.error("Error fetching SSE:", streamRes.status, errText);
    return res.status(streamRes.status).json({ error: errText });
  }

  const reader = streamRes.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let botReply = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    for (const line of chunk.split("\n")) {
      if (line.startsWith("data:")) {
        try {
          const payload = JSON.parse(line.slice(5).trim());
          botReply += payload[0];
        } catch {}
      }
    }
  }

  return res.status(200).json({ reply: botReply });
}
