// src/services/orchestrator.js

const { callOpenAI } = require("../utils/aiClient");
const analyzeInsights = require("../utils/aiInsightsEngine");
const detectAI = require("../utils/aiContentDetector");

// ===============================
// CONFIG (safe defaults)
// ===============================
const MAX_TEXT_LENGTH = 5000;
const MAX_RETRIES = 2;
const AI_THRESHOLD = 55;

// ===============================
// SIMPLE HELPERS
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
  return text
    .replace(/^.*Rewritten:\s*/is, "")
    .replace(/\n+/g, " ")
    .trim();
}

// deterministic humanization (no AI)
function humanizeDeterministic(text) {
  return text
    .replace(/\bFurthermore\b|\bMoreover\b|\bIn addition\b/gi, "Also")
    .replace(/\.\s+\./g, ".")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ===============================
// PROMPT BUILDER
// ===============================
function buildPrompt(text, mode, retry) {
  let rules = `
You are a professional human editor.

Rules:
- Keep meaning identical
- Return ONLY rewritten text
- No explanations
- No lists
- No headings
- Natural sentence rhythm
`;

  if (mode === "anti-ai" || retry > 0) {
    rules += `
- Avoid predictable phrasing
- Avoid symmetry
- Use natural imperfections
`;
  }

  if (mode === "seo") {
    rules += `
- Improve clarity for search engines
- Do NOT keyword stuff
`;
  }

  return `${rules}\nText:\n${text}`;
}

// ===============================
// CORE ORCHESTRATOR
// ===============================
async function runParaphraser({ text, mode }) {
  // STEP 1: validation
  if (!isTextValid(text)) {
    return {
      status: "error",
      message: "Invalid or too long text"
    };
  }

  // STEP 2: baseline metrics
  const beforeInsights = analyzeInsights(text);
  const beforeAI = await detectAI(text);

  let bestResult = null;
  let retriesUsed = 0;

  // STEP 3–6: rewrite loop
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    retriesUsed = attempt;

    let aiText = null;

    try {
      const prompt = buildPrompt(text, mode, attempt);
      aiText = await callOpenAI(prompt);
    } catch (err) {
      continue;
    }

    if (!aiText) continue;

    let rewritten = cleanAIOutput(aiText);
    rewritten = humanizeDeterministic(rewritten);

    // STEP 5: metrics after rewrite
    const afterInsights = analyzeInsights(rewritten);
    const afterAI = await detectAI(rewritten);

    const candidate = {
      text: rewritten,
      insights: afterInsights,
      aiScore: afterAI,
      attempt
    };

    // STEP 7: pick best candidate
    if (
      !bestResult ||
      candidate.aiScore < bestResult.aiScore
    ) {
      bestResult = candidate;
    }

    // STEP 6: break early if good enough
    if (candidate.aiScore < AI_THRESHOLD) {
      break;
    }
  }

  // STEP 9: fallback protection
  if (!bestResult) {
    return {
      status: "partial",
      output: humanizeDeterministic(text),
      retriesUsed,
      fallback: true
    };
  }

  // STEP 8: final response
  return {
    status: "success",
    mode,
    input: text,
    output: bestResult.text,
    retriesUsed,
    aiDetection: {
      before: beforeAI,
      after: bestResult.aiScore
    },
    insights: {
      before: beforeInsights,
      after: bestResult.insights
    }
  };
}

module.exports = { runParaphraser };
