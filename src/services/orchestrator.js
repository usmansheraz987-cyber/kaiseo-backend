// src/services/orchestrator.js

const { generateText } = require("../../utils/aiClient");
const { analyzeInsights } = require("../../utils/aiInsightsEngine");

const MAX_RETRIES = 3;

// ---------------- HELPERS ----------------

function normalize(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function isTooSimilar(a, b) {
  return normalize(a) === normalize(b);
}

function randomTemperature() {
  return 0.85 + Math.random() * 0.4; // 0.85 → 1.25
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

// ---------------- CORE ----------------

async function runParaphraser({ text, mode = "anti-ai" }) {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid text input");
  }

  let attempts = 0;
  let output = "";
  let previous = text;

  while (attempts < MAX_RETRIES) {
    attempts++;

    output = await generateText({
      prompt: `
${randomStyle()}

Rules:
- Full rewrite
- Change sentence structure
- Do NOT keep original phrasing
- Sound human, not AI

Text:
${text}
      `,
      temperature: randomTemperature()
    });

    if (!isTooSimilar(previous, output)) break;
    previous = output;
  }

  return {
    status: "success",
    mode,
    input: text,
    output,
    retriesUsed: attempts,
    forcedRewrite: true,
    comparison: {
      beforeText: text,
      afterText: output,
      note: "Rewrite forced for all users"
    }
  };
}

module.exports = {
  runParaphraser
};
