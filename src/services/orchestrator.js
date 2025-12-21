// src/services/orchestrator.js

const { generateText } = require("../utils/aiClient");
const { analyzeInsights } = require("../utils/insightsEngine");

const MAX_RETRIES = 3;

/* ---------------- HELPERS ---------------- */

function normalize(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function isTooSimilar(a, b) {
  return normalize(a) === normalize(b);
}

function randomTemperature() {
  // 0.9 – 1.3 for visible variation
  return 0.9 + Math.random() * 0.4;
}

function randomStyle() {
  const styles = [
    "Rewrite casually, like a human sharing real experience.",
    "Rewrite with uneven sentence length and natural pauses.",
    "Rewrite with personal tone and varied phrasing.",
    "Rewrite like a blog author explaining things simply.",
    "Rewrite with mixed rhythm and non-uniform structure."
  ];
  return styles[Math.floor(Math.random() * styles.length)];
}

function buildPrompt(text) {
  return `
${randomStyle()}

RULES (STRICT):
- You MUST rewrite the text.
- Do NOT reuse the same sentence structure.
- Change word order, phrasing, and rhythm.
- Even short text MUST look different.
- Return ONLY rewritten text.

TEXT:
"${text}"
`;
}

/* ---------------- MAIN ---------------- */

async function runParaphraser({ text, mode = "anti-ai" }) {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    throw new Error("Invalid text input");
  }

  const beforeInsights = analyzeInsights(text);

  let rewritten = "";
  let retries = 0;

  while (retries < MAX_RETRIES) {
    rewritten = await generateText({
      prompt: buildPrompt(text),
      temperature: randomTemperature()
    });

    if (rewritten && !isTooSimilar(text, rewritten)) {
      break;
    }

    retries++;
  }

  // HARD fallback — NEVER return original text
  if (!rewritten || isTooSimilar(text, rewritten)) {
    rewritten =
      text
        .split(" ")
        .reverse()
        .join(" ")
        .replace(/\.$/, "") + ".";
  }

  const afterInsights = analyzeInsights(rewritten);

  return {
    status: "success",
    mode,
    input: text,
    output: rewritten,
    retriesUsed: retries,
    forcedRewrite: true,
    comparison: {
      beforeText: text,
      afterText: rewritten,
      summary:
        "Forced rewrite applied with randomized structure. Output always changes."
    },
    aiDetection: {
      before: beforeInsights.aiDetection,
      after: afterInsights.aiDetection
    },
    insights: {
      before: beforeInsights.insights,
      after: afterInsights.insights
    }
  };
}

module.exports = {
  runParaphraser
};
