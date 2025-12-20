// src/services/orchestrator.js

const { callOpenAI } = require("../../utils/aiClient");
const detectAI = require("../../utils/aiContentDetector");
const analyzeInsights = require("../../utils/aiInsightsEngine");

// ================= CONFIG =================
const MAX_TEXT_LENGTH = 5000;
const MAX_RETRIES = 2;

// ================= HELPERS =================
function isTextValid(text) {
  if (!text || typeof text !== "string") return false;
  if (text.trim().length < 10) return false;
  if (text.length > MAX_TEXT_LENGTH) return false;
  return true;
}

function cleanAIOutput(text) {
  if (!text) return "";
  return text
    .replace(/^Rewritten:\s*/i, "")
    .replace(/^Output:\s*/i, "")
    .trim();
}

function countSentences(text) {
  return text.split(/[.!?]+/).filter(Boolean).length;
}

// ================= FORCE REWRITE =================
function shouldForceRewrite({ mode, text, beforeAI }) {
  if (mode !== "anti-ai") return false;
  if (!beforeAI || typeof beforeAI.aiProbability !== "number") return false;
  return countSentences(text) === 1 && beforeAI.aiProbability >= 40;
}

// ================= HARD FALLBACK =================
function hardRewriteSingleSentence(text) {
  return text
    .replace(/^SEO helps/i, "Search engine optimization helps")
    .replace(/rank higher on search engines/i, "achieve better positions in search results");
}

// ================= PROMPT BUILDER =================
function buildPrompt(text, mode, forceRewrite) {
  const base = `Rewrite the following text while preserving meaning:\n\n"${text}"\n`;

  if (forceRewrite) {
    return `
You MUST rewrite this sentence.
The rewritten text must be structurally different.
Do NOT reuse the same sentence pattern.
Change word order and phrasing.
Return ONLY the rewritten text.

${base}
`;
  }

  switch (mode) {
    case "anti-ai":
      return `
Rewrite to avoid AI-detection patterns.
Increase variation.
Change sentence structure.
Avoid generic phrasing.

${base}
`;
    case "seo":
      return `
Rewrite for SEO clarity.
Natural keywords.
No stuffing.

${base}
`;
    case "formal":
      return `
Rewrite in a professional, formal tone.
No contractions.

${base}
`;
    case "casual":
      return `
Rewrite in a relaxed, conversational tone.

${base}
`;
    default:
      return `
Rewrite naturally like a human writer.

${base}
`;
  }
}

// ================= COMPARISON =================
function buildComparison(beforeAI, afterAI, beforeText, afterText) {
  return {
    beforeText,
    afterText,
    aiProbabilityDrop: beforeAI.aiProbability - afterAI.aiProbability,
    verdictChange: `${beforeAI.verdict} → ${afterAI.verdict}`,
    summary:
      beforeAI.aiProbability > afterAI.aiProbability
        ? "AI probability reduced and structure improved."
        : "Structure changed; AI probability unchanged (expected for short text).",
  };
}

// ================= MAIN =================
async function runParaphraser({ text, mode = "human" }) {
  if (!isTextValid(text)) throw new Error("Invalid input text");

  const beforeAI = await detectAI(text);
  const beforeInsights = analyzeInsights(text);

  const forceRewrite = shouldForceRewrite({ mode, text, beforeAI });

  let rewritten = null;
  let retriesUsed = 0;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    retriesUsed = attempt;
    try {
      const prompt = buildPrompt(text, mode, forceRewrite);
      const aiText = await callOpenAI(prompt);
      rewritten = cleanAIOutput(aiText);
      if (rewritten && rewritten !== text) break;
    } catch {
      continue;
    }
  }

  if (forceRewrite && (!rewritten || rewritten === text)) {
    rewritten = hardRewriteSingleSentence(text);
  }

  const finalText = rewritten || text;

  const afterAI = await detectAI(finalText);
  const afterInsights = analyzeInsights(finalText);

  return {
    status: "success",
    mode,
    input: text,
    output: finalText,
    retriesUsed,
    forcedRewrite: forceRewrite,

    comparison: buildComparison(
      beforeAI,
      afterAI,
      text,
      finalText
    ),

    aiDetection: {
      before: beforeAI,
      after: afterAI,
    },

    insights: {
      before: beforeInsights,
      after: afterInsights,
    },
  };
}

module.exports = {
  runParaphraser,
};
