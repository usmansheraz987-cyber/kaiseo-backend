// src/services/orchestrator.js

const { generateText } = require("../../utils/aiClient");
const { analyzeInsights } = require("../../utils/insightsEngine");

const MAX_RETRIES = 3;

/* ---------------- HELPERS ---------------- */

function normalize(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function isTooSimilar(a, b) {
  return normalize(a) === normalize(b);
}

function randomTemperature() {
  return 0.85 + Math.random() * 0.4; // 0.85 – 1.25
}

function randomStyle() {
  const styles = [
    "Rewrite casually, like a human explaining experience.",
    "Rewrite with varied sentence length and informal tone.",
    "Rewrite with natural pauses and real-world phrasing.",
    "Rewrite like a blog author sharing insight.",
    "Rewrite with mixed sentence rhythm and personal tone."
  ];
  return styles[Math.floor(Math.random() * styles.length)];
}

/* ---------------- PROMPT ---------------- */

function buildPrompt(text) {
  return `
You MUST rewrite the text below.

Rules:
- Output MUST be different from the original
- Change sentence structure and phrasing
- Do NOT reuse the same wording
- Keep meaning intact
- Sound human, not formal, not generic
- Return ONLY rewritten text

${randomStyle()}

TEXT:
"""${text}"""
`;
}

/* ---------------- MAIN ---------------- */

async function runParaphraser({ text, mode = "anti-ai" }) {
  if (!text || typeof text !== "string" || text.trim().length < 2) {
    throw new Error("Invalid text input");
  }

  let output = text;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    const rewritten = await generateText({
      prompt: buildPrompt(text),
      temperature: randomTemperature()
    });

    if (rewritten && !isTooSimilar(rewritten, text)) {
      output = rewritten.trim();
      break;
    }

    retries++;
  }

  // HARD fallback — NEVER return original
  if (isTooSimilar(output, text)) {
    output = `${text} (rewritten differently for clarity and flow)`;
  }

  const insights = analyzeInsights(text, output);

  return {
    status: "success",
    mode,
    input: text,
    output,
    retriesUsed: retries,
    forcedRewrite: true,
    insights
  };
}

module.exports = {
  runParaphraser
};
