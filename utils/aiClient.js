// utils/aiClient.js
const fetch = require('node-fetch'); // you already installed node-fetch
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_KEY) {
  // don't crash — caller will handle
  console.warn('OpenAI key missing (utils/aiClient).');
}

async function callOpenAI(prompt, model = 'gpt-4o-mini', max_tokens = 400) {
  if (!OPENAI_KEY) throw new Error('Missing OpenAI API key');

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model,
      input: prompt,
      max_output_tokens: max_tokens,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI call failed: ${res.status} ${txt}`);
  }

  const data = await res.json();
  // Responses API: pick sensible content path
  // try several safe fallbacks
  try {
    // new Responses API returns data.output[0].content[0].text or similar
    if (data.output && Array.isArray(data.output) && data.output.length) {
      const first = data.output[0];
      if (first.content && Array.isArray(first.content)) {
        const textParts = first.content.map(c => (c.text || '')).join('');
        if (textParts) return textParts.trim();
      }
    }
  } catch (e) {
    // fallback to stringing top-level fields
  }

  // fallback to JSON stringify if needed
  return JSON.stringify(data);
}

module.exports = { callOpenAI };
