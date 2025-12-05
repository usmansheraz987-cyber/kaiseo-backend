// utils/aiClient.js
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "" // Render / system env must contain this
});

async function callOpenAI(prompt) {
  // Use Responses API
  const res = await client.responses.create({
    model: "gpt-4o-mini", // change model if needed / available on your account
    input: prompt,
    max_output_tokens: 4000
  });

  // Responses API nested shape: pick the text
  // defensive access:
  try {
    const text = (res.output && res.output[0] && res.output[0].content && res.output[0].content[0] && res.output[0].content[0].text)
      || (res.output_text) // older responses
      || JSON.stringify(res);
    return text;
  } catch (err) {
    return null;
  }
}

module.exports = { callOpenAI };
