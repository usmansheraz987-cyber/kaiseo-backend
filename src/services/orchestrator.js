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

// ================= PROMPT BUILDER =================
function buildPrompt(text, mode, attempt, forceRewrite) {
  const base = `Rewrite the following text while preserving meaning:\n\n"${text}"\n`;

  if (forceRewrite) {
    return `
You MUST rewrite this sentence even if it sounds human.
Change structure, phrasing, and rhythm.
Avoid synonyms-only changes.
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
Do NOT add fluff.

${base}
`;
    case "seo":
      return `
Rewrite for SEO clarity.
Natural keywords.
No stuffing.
Readable and concise.

${base}
`;
    case "formal":
      return `
Rewrite in a professional, formal tone.
No contractions.
Clear and precise.

${base}
`;
    case "casual":
      return `
Rewrite in a relaxed, conversational tone.
Natural flow.
Friendly wording.

${base}
`;
    default:
      return `
Rewrite naturally like a human writer.
Balanced tone.

${base}
`;
  }
}

// ================= SCORING =================
function calculateHumanizationScore(before, after) {
  let score = 50;

  if (after.aiProbability < before.aiProbability) score += 20;
  if (after.signals.sentenceVariance !== before.signals.sentenceVariance) score += 10;
  if (before.signals.uniformSentences && !after.signals.uniformSentences) score += 10;

  return Math.min(100, Math.max(0, score));
}

function buildComparison(before, after) {
  return {
    aiProbabilityChange: before.aiProbability - after.aiProbability,
    sentenceVarianceImproved:
      before.signals.sentenceVariance !== after.signals.sentenceVariance,
    uniformityReduced:
      before.signals.uniformSentences && !after.signals.uniformSentences,
  };
}

function buildSummary(score) {
  if (score >= 75) return "Strong humanization improvement detected.";
  if (score >= 55) return "Moderate improvement with more natural phrasing.";
  return "Minor changes detected. Content already human-like.";
}

// ================= MAIN =================
async function runParaphraser({ text, mode = "human" }) {
  if (!isTextValid(text)) {
    throw new Error("Invalid input text");
  }

  const beforeAI = await detectAI(text);
  const beforeInsights = analyzeInsights(text);

  let bestResult = null;
  let retriesUsed = 0;

  const forceRewrite = shouldForceRewrite({ mode, text, beforeAI });

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    retriesUsed = attempt;

    let aiText = null;
    try {
      const prompt = buildPrompt(text, mode, attempt, forceRewrite);
      aiText = await callOpenAI(prompt);
    } catch {
      if (!forceRewrite) continue;
    }

    if (!aiText && !forceRewrite) continue;

    let rewritten = cleanAIOutput(aiText || text);

    const afterAI = await detectAI(rewritten);
    const afterInsights = analyzeInsights(rewritten);

    bestResult = {
      rewritten,
      afterAI,
      afterInsights,
    };

    break;
  }

  const afterAI = bestResult?.afterAI || beforeAI;
  const afterInsights = bestResult?.afterInsights || beforeInsights;

  const humanizationScore = calculateHumanizationScore(beforeAI, afterAI);
  const comparison = buildComparison(beforeAI, afterAI);

  return {
    status: "success",
    mode,
    input: text,
    output: bestResult?.rewritten || text,
    retriesUsed,
    forcedRewrite: forceRewrite,
    humanizationScore,
    improvementSummary: buildSummary(humanizationScore),
    comparison,
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
