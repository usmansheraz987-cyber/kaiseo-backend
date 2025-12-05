// utils/aiClient.js
const { OpenAI } = require("openai");
require("dotenv").config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL   = process.env.OPENAI_MODEL || "gpt-4o-mini"; // configurable

let client = null;
if (OPENAI_API_KEY) {
  client = new OpenAI({ apiKey: OPENAI_API_KEY });
}

/**
 * Build short, controlled instruction per mode to keep outputs consistent.
 * Keep prompts short to reduce cost and increase reliability.
 */
function buildPrompt(text, mode) {
  const base = `Rewrite the following text according to the mode specified. Return only the rewritten text, nothing else.`;
  switch (mode) {
    case "humanize":
      return `${base} Make it sound natural and conversational: "${text}"`;
    case "rewrite":
      return `${base} Rephrase while keeping meaning and clarity: "${text}"`;
    case "expand":
      return `${base} Expand the text with one extra explanatory sentence: "${text}"`;
    case "shorten":
      return `${base} Shorten the text to a concise version (one line): "${text}"`;
    case "grammar":
      return `${base} Fix grammar and punctuation: "${text}"`;
    case "seo":
      return `${base} Rewrite to be SEO friendly (clear headline-like phrasing): "${text}"`;
    case "formal":
      return `${base} Make the tone formal and professional: "${text}"`;
    case "casual":
      return `${base} Make the tone casual and friendly: "${text}"`;
    case "academic":
      return `${base} Make the tone academic and precise: "${text}"`;
    case "simple":
      return `${base} Simplify vocabulary for general audience: "${text}"`;
    default:
      return `${base} Rephrase: "${text}"`;
  }
}

/**
 * generateParaphrase(text, mode)
 * Returns string with rewritten text OR throws.
 */
async function generateParaphrase(text, mode, opts = {}) {
  // If no OpenAI key, immediately throw so caller can fallback.
  if (!client) {
    throw new Error("Missing OpenAI client / API key");
  }

  const prompt = buildPrompt(text, mode);
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const timeoutMs = opts.timeoutMs || 15000; // 15s

  // Responses API — minimal usage to stay clear and consistent
  try {
    const resp = await client.responses.create({
      model,
      input: prompt,
      // keep it deterministic-ish, but configurable
      temperature: typeof opts.temperature === "number" ? opts.temperature : 0.2,
      max_output_tokens: opts.maxTokens || 300,
    });

    // New Responses API returns output[0].content[0].text or similar.
    // We'll attempt to extract the textual answer robustly:
    const output = resp.output?.[0];
    if (!output) {
      // fallback: try stringified response
      if (resp.output_text) return resp.output_text;
      throw new Error("No response output from OpenAI");
    }

    // Many SDKs put text in output.content by chunk
    if (Array.isArray(output.content)) {
      // join text parts if any
      const textParts = output.content
        .map((c) => (typeof c === "string" ? c : c.text || ""))
        .filter(Boolean);
      if (textParts.length) return textParts.join("").trim();
    }

    // older property
    if (output.text) return output.text.trim();

    // final attempt
    if (resp.output_text) return resp.output_text.trim();

    throw new Error("Unable to parse AI response");
  } catch (err) {
    // bubble error to caller so they can fallback
    err.isOpenAIError = true;
    throw err;
  }
}

module.exports = { generateParaphrase };
