// pages/api/chat.js

/**
 * Simplified proxy API route forwarding messages to Ollama.
 * No streaming—returns full reply JSON.
 *
 * Environment variables required:
 *   - CHATBOT_URL       (ngrok or custom domain)
 *   - CHATBOT_MODEL     (optional, default: 'llama2:latest')
 *   - SUPABASE_URL      (optional, for persistence)
 *   - SUPABASE_ANON_KEY (optional, for persistence)
 */
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// Initialize Supabase client if configured
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Debug: log incoming body
  console.log('REQ BODY:', req.body);

  const { sessionId, message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Missing parameter: message' });
  }

  // Validate CHATBOT_URL
  const API_URL = process.env.CHATBOT_URL;
  if (!API_URL) {
    console.error('CHATBOT_URL not set');
    return res.status(500).json({ error: 'Server misconfiguration: CHATBOT_URL missing' });
  }
  const MODEL = process.env.CHATBOT_MODEL || 'llama2:latest';

  try {
    // Call external API
    const response = await fetch(
      `${API_URL.replace(/\/+$/,'')}/v1/chat/completions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: message }] }),
      }
    );

    // Proxy HTTP errors
    if (!response.ok) {
      const text = await response.text();
      console.error('External API Error:', response.status, text);
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    console.log('External API Data:', data);

    // Optionally persist here

    // Return full data, let client extract reply
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Proxy handler exception:', error);
    return res.status(500).json({ error: error.message || 'Unknown error' });
  }
}
