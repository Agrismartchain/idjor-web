// src/multiChat.js
export async function queryAgents(sessionId, question) {
  const res = await fetch('/api/multiChat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, question })
  });
  if (!res.ok) throw new Error(`Multi-agent call failed (${res.status})`);
  return res.json();  // → { ExpertAgri: "...", DataAnalyst: "..." }
}
