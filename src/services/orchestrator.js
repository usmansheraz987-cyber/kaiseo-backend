// src/services/orchestrator.js

const { callOpenAI } = require("../../utils/aiClient");
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
  return text
    .replace(/^.*Rewritten:\s*/is, "")
    .replace(/\n+/g, " ")
    .trim();
}

function humanizeDeterministic(text) {
  return text
    .replace(/\bFurthermore\b|\bMoreover\b|\bIn addition\b/gi, "Also")
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
- Output ONLY rewritten text
- No explanations
- No lists
- Natural sentence rhythm
`;

  if (mode === "anti-ai" || retry > 0) {
    rules += `
- Avoid predictable phrasing
- Avoid symmetry
- Sound human, not AI
`;
  }

  if (mode === "seo") {
    rules += `
- Improve clarity for SEO
- Do NOT keyword stuff
`;
  }

  return `${rules}\nText:\n${text}`;
}

// ===============================
// CORE ORCHESTRATOR
// ===============================
async function runParaphraser({ text, mode = "human" }) {
  // STEP 1: validation
  if (!isTextValid(text)) {
    return {
      status: "error",
      message: "Invalid or too short text"
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
    let aiText = "";

    try {
      const prompt = buildPrompt(text, mode, attempt);

      let response = await callOpenAI({
        messages: [
          { role: "system", content: "You are a professional human editor." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      });

      // normalize aiClient response
      if (typeof response === "string") {
        aiText = response;
      } else if (response && typeof response === "object") {
        aiText =
          response.text ||
          response.content ||
          response.output ||
          response.result ||
          response.message ||
          "";
      }

    } catch (err) {
      continue;
    }

    if (!aiText) continue;

    let rewritten = cleanAIOutput(aiText);
    rewritten = humanizeDeterministic(rewritten);

    if (!rewritten) continue;

    // STEP 5: metrics after rewrite
    const afterInsights = analyzeInsights(rewritten);
    const afterAI = await detectAI(rewritten);

    const candidate = {
      text: rewritten,
      insights: afterInsights,
      aiScore: afterAI,
      attempt
    };

    // STEP 7: pick best
    if (!bestResult || candidate.aiScore < bestResult.aiScore) {
      bestResult = candidate;
    }

    if (candidate.aiScore < AI_THRESHOLD) break;
  }

  // STEP 9: fallback
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
