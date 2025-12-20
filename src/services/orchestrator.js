// src/services/orchestrator.js

const { generateJson } = require("../../utils/aiClient");
const analyzeInsights = require("../../utils/aiInsightsEngine");
const detectAI = require("../../utils/aiContentDetector");

// ===============================
// CONFIG
// ===============================
const MAX_TEXT_LENGTH = 5000;
const MAX_RETRIES = 2;
const AI_THRESHOLD = 55;

// ===============================
// HELPERS
// ===============================
function isTextValid(text) {
  if (!text) return false;
  if (typeof text !== "string") return false;
  if (text.trim().length < 20) return false;
  if (text.length > MAX_TEXT_LENGTH) return false;
  return true;
}

function cleanAIOutput(text) {
  if (!text) return "";
  return text.replace(/\n+/g, " ").trim();
}

function humanizeDeterministic(text) {
  return text
    .replace(/\bFurthermore\b|\bMoreover\b|\bIn addition\b/gi, "Also")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ===============================
// PROMPT
// ===============================
function buildPrompt(text, mode, retry) {
  let rules = `
You are a professional human editor.

Rules:
- Keep meaning identical
- Rewrite naturally
- Do not explain anything
- Return ONLY the rewritten text
`;

  if (mode === "anti-ai" || retry > 0) {
    rules += `
- Avoid predictable phrasing
- Vary sentence length
- Sound human
`;
  }

  if (mode === "seo") {
    rules += `
- Improve clarity for SEO
- Do NOT keyword stuff
`;
  }

  return `${rules}\n\nText:\n${text}`;
}

// ===============================
// ORCHESTRATOR
// ===============================
async function runParaphraser({ text, mode = "human" }) {
  if (!isTextValid(text)) {
    return {
      status: "error",
      message: "Invalid or too short text"
    };
  }

  const beforeInsights = analyzeInsights(text);
  const beforeAI = await detectAI(text);

  let best = null;
  let retriesUsed = 0;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    retriesUsed = attempt;

    let aiText = "";
    try {
      const prompt = buildPrompt(text, mode, attempt);
      aiText = await generateJson(prompt);
    } catch {
      continue;
    }

    if (!aiText) continue;

    let rewritten = humanizeDeterministic(cleanAIOutput(aiText));
    if (!rewritten) continue;

    const afterInsights = analyzeInsights(rewritten);
    const afterAI = await detectAI(rewritten);

    const candidate = {
      text: rewritten,
      aiScore: afterAI,
      insights: afterInsights
    };

    if (!best || candidate.aiScore < best.aiScore) {
      best = candidate;
    }

    if (candidate.aiScore < AI_THRESHOLD) break;
  }

  if (!best) {
    return {
      status: "partial",
      output: humanizeDeterministic(text),
      retriesUsed,
      fallback: true
    };
  }

  return {
    status: "success",
    mode,
    input: text,
    output: best.text,
    retriesUsed,
    aiDetection: {
      before: beforeAI,
      after: best.aiScore
    },
    insights: {
      before: beforeInsights,
      after: best.insights
    }
  };
}

module.exports = { runParaphraser };
