// api/multiChat.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { sessionId, question } = req.body;
  if (!sessionId || !question) {
    return res.status(400).json({ error: 'sessionId and question are required' });
  }

  // Liste de tes agents avec leurs system prompts
  const agents = [
    { name: 'ExpertAgri',     system: 'You are an expert in Ivorian agriculture, specialist in cocoa and coffee farming.' },
    { name: 'DataAnalyst',    system: 'You are a data analyst. Given agricultural datasets, you provide insights and recommendations.' },
    // Ajoute d’autres agents ici…
  ];

  // Récupère la config
  const API_URL     = process.env.CHATBOT_URL;
  const MODEL       = process.env.CHATBOT_MODEL || 'mistral-v0.3';
  const MAX_HISTORY = parseInt(process.env.CHATBOT_MAX_HISTORY) || 20;

  // On lit l’historique depuis Supabase ou autre (simplifié ici)
  // Pour l’exemple, on envoie juste la dernière question
  const recent = [ { role:'user', content: question } ];

  // Pour chaque agent, on appelle /v1/chat/completions en parallèle
  const calls = agents.map(async (agn) => {
    const payload = {
      model: MODEL,
      messages: [
        { role: 'system',  content: agn.system },
        ...recent
      ]
    };
    const r = await fetch(`${API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await r.json();
    return { name: agn.name, reply: json.choices?.[0]?.message?.content || '' };
  });

  try {
    const results = await Promise.all(calls);
    // Transforme en objet { ExpertAgri: "...", DataAnalyst: "..." }
    const output = {};
    results.forEach(r => { output[r.name] = r.reply });
    return res.status(200).json(output);
  } catch (err) {
    console.error('Multi-agent error:', err);
    return res.status(500).json({ error: 'Multi-agent orchestration failed' });
  }
}
