// src/services/orchestrator.js

const { generateText } = require("../utils/aiClient");

const MAX_RETRIES = 4;

/* =========================
   TEXT HELPERS
========================= */

function normalize(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function similarityCheck(a, b) {
  return normalize(a) === normalize(b);
}

function randomTemperature() {
  return 0.9 + Math.random() * 0.5; // 0.9 – 1.4
}

function randomStyle() {
  const styles = [
    "Rewrite casually like a human explaining something.",
    "Rewrite with uneven sentence length and natural pauses.",
    "Rewrite like a person sharing real experience.",
    "Rewrite informally with human rhythm.",
    "Rewrite with mixed tone, slight imperfections allowed.",
    "Rewrite like a blog author, not an AI.",
    "Rewrite naturally, avoiding textbook structure."
  ];
  return styles[Math.floor(Math.random() * styles.length)];
}

/* =========================
   PROMPT BUILDER
========================= */

function buildPrompt(text) {
  return `
You MUST rewrite the text below.

STRICT RULES:
- Always change wording and structure
- Never reuse original phrasing
- Even if the text is very short, rewrite it
- Do NOT explain anything
- Do NOT keep sentence order
- Output must sound human
- Return ONLY the rewritten text

Style instruction:
${randomStyle()}

Original text:
"${text}"
`;
}

/* =========================
   MAIN ORCHESTRATOR
========================= */

async function runParaphraser({ text, mode = "anti-ai" }) {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid text input");
  }

  let finalOutput = text;
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    attempts++;

    const prompt = buildPrompt(text);

    const rewritten = await generateText({
      prompt,
      temperature: randomTemperature()
    });

    if (!rewritten || typeof rewritten !== "string") {
      continue;
    }

    if (!similarityCheck(text, rewritten)) {
      finalOutput = rewritten.trim();
      break;
    }
  }

  return {
    status: "success",
    mode,
    input: text,
    output: finalOutput,
    retriesUsed: attempts,
    forcedRewrite: true,
    comparison: {
      beforeText: text,
      afterText: finalOutput,
      note: "Rewrite forced for all users"
    }
  };
}

module.exports = {
  runParaphraser
};
