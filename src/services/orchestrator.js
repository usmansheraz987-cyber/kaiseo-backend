const { callOpenAI } = require("../utils/aiClient");
const analyzeInsights = require("../utils/aiInsightsEngine");
const detectAI = require("../utils/aiContentDetector");

// ================= CONFIG =================
const MAX_TEXT_LENGTH = 5000;
const MAX_RETRIES = 2;

// ================= HELPERS =================
function isTextValid(text) {
  return typeof text === "string" && text.trim().length >= 20 && text.length <= MAX_TEXT_LENGTH;
}

function cleanAIOutput(text) {
  if (!text) return "";
  return text
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .replace(/^Rewrite(d)?\s*:\s*/i, "")
    .trim();
}

function buildPrompt(text, mode, retry) {
  let baseRules = `
Rewrite the text naturally.
Keep the meaning identical.
Do not explain anything.
Return ONLY the rewritten text.
`;

  let modeRules = "";

  switch (mode) {
    case "anti-ai":
      modeRules = `
Avoid predictable phrasing.
Break sentence symmetry.
Mix short and long sentences.
Avoid textbook definitions.
Use subtle human phrasing.
`;
      break;

    case "seo":
      modeRules = `
Improve clarity and flow.
Preserve keywords naturally.
Avoid keyword stuffing.
`;
      break;

    case "formal":
      modeRules = `
Use professional tone.
Avoid contractions.
Keep language precise.
`;
      break;

    case "casual":
      modeRules = `
Use relaxed, conversational tone.
Allow contractions.
Sound human.
`;
      break;

    case "human":
    default:
      modeRules = `
Sound natural and balanced.
Avoid extremes.
`;
  }

  if (retry > 0) {
    modeRules += `
Change sentence structure more than before.
Avoid repeating earlier phrasing.
`;
  }

  return `
${baseRules}
${modeRules}

Text:
${text}
`;
}

// ================= SCORING =================
function calculateHumanizationScore(beforeAI, afterAI) {
  if (!beforeAI || !afterAI) return 0;

  const improvement = beforeAI.aiProbability - afterAI.aiProbability;
  return Math.max(0, Math.min(100, Math.round(50 + improvement)));
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

  // BEFORE METRICS
  const beforeInsights = analyzeInsights(text);
  const beforeAI = await detectAI(text);

  let bestOutput = text;
  let retriesUsed = 0;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    retriesUsed = attempt;

    try {
      const prompt = buildPrompt(text, mode, attempt);
      const aiText = await callOpenAI(prompt);
      const cleaned = cleanAIOutput(aiText);

      if (cleaned) {
        bestOutput = cleaned;
        break;
      }
    } catch (err) {
      continue;
    }
  }

  // AFTER METRICS
  const afterInsights = analyzeInsights(bestOutput);
  const afterAI = await detectAI(bestOutput);

  const humanizationScore = calculateHumanizationScore(beforeAI, afterAI);

  return {
    status: "success",
    mode,
    input: text,
    output: bestOutput,
    retriesUsed,
    humanizationScore,
    improvementSummary: buildSummary(humanizationScore),
    comparison: buildComparison(beforeAI, afterAI),
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

module.exports = { runParaphraser };
