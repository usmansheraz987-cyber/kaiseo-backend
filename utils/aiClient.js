// utils/aiClient.js
const OpenAI = require("openai");

function getClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OpenAI API Key (process.env.OPENAI_API_KEY)");
  return new OpenAI({ apiKey: key });
}

/**
 * generateParaphrase(text, mode, options)
 * - text: string
 * - mode: rewrite|humanize|shorten|expand|seo|formal|casual|academic|grammar
 * - options: { temperature: 0.7 }
 *
 * Returns a string result or throws an Error.
 */
async function generateParaphrase(text, mode = "rewrite", opts = {}) {
  const client = getClient();

  // Minimal safe prompt per mode
  let instruction = "Rewrite the following text.";
  switch (mode) {
    case "humanize": instruction = "Rewrite to sound more human and conversational."; break;
    case "shorten": instruction = "Shorten the text, keep meaning."; break;
    case "expand": instruction = "Expand the text with one extra explanatory sentence."; break;
    case "seo": instruction = "Rewrite to be SEO friendly and clear."; break;
    case "formal": instruction = "Rewrite in a formal tone."; break;
    case "casual": instruction = "Rewrite in a casual tone."; break;
    case "academic": instruction = "Rewrite in an academic tone."; break;
    case "grammar": instruction = "Fix grammar and capitalization."; break;
    default: instruction = "Rewrite the following text."; break;
  }

  // Use Responses API (OpenAI v6)
  try {
    const resp = await client.responses.create({
      model: "gpt-4o-mini", // change to a model you have access to, or "gpt-4o" / "gpt-5" etc
      input: `${instruction}\n\nText: ${text}`,
      temperature: typeof opts.temperature === "number" ? opts.temperature : 0.6,
    });

    // Responses API: extract text
    const output = resp.output?.[0]?.content?.find(c => c.type === "output_text")?.text;
    if (output && output.trim().length) return output.trim();

    // fallback: try to parse content items or choices
    // older client style compatibility:
    if (resp.output_text) return resp.output_text;
    if (resp?.choices?.[0]?.message?.content) return resp.choices[0].message.content;

    throw new Error("AI returned no text response");
  } catch (err) {
    // rethrow with a helpful message
    const msg = err?.message || String(err);
    throw new Error(`OpenAI request failed: ${msg}`);
  }
}

module.exports = { generateParaphrase };
