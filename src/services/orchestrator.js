const { generateText } = require("../../utils/aiClient");
const analyzeInsights = require("../../utils/aiInsightsEngine");
const detectAI = require("../../utils/aiContentDetector");

// ===============================
// CONFIG
// ===============================
const MAX_TEXT_LENGTH = 5000;
const MAX_RETRIES = 2;
const AI_THRESHOLD = 55;

// ===============================
// VALIDATION
// ===============================
function isTextValid(text) {
  if (!text || typeof text !== "string") return false;
  if (text.trim().length < 20) return false;
  if (text.length > MAX_TEXT_LENGTH) return false;
  return true;
}

// ===============================
// CLEANING & HUMANIZATION
// ===============================
function cleanAIOutput(text) {
  return text.replace(/\n+/g, " ").trim();
}

function humanizeDeterministic(text) {
  return text
    .replace(/\bFurthermore\b|\bMoreover\b|\bIn addition\b/gi, "Also")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ===============================
// PROMPT BUILDER (MODES)
// ===============================
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
Avoid generic definitions.
Add subtle human nuance where natural.
`;
      break;

    case "seo":
      modeRules = `
Improve clarity and flow.
Preserve important keywords naturally.
Avoid keyword stuffing.
Prefer clear, scannable sentences.
`;
      break;

    case "formal":
      modeRules = `
Use a professional and neutral tone.
Avoid contractions.
Keep language precise and structured.
`;
      break;

    case "casual":
      modeRules = `
Use a relaxed, conversational tone.
Allow contractions.
Sound like a real person explaining something.
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

  // STEP 2: baseline analysis
  const beforeInsights = analyzeInsights(text);
  const beforeAI = await detectAI(text);

  let bestCandidate = null;
  let retriesUsed = 0;

  // STEP 3–6: rewrite attempts
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    retriesUsed = attempt;

    let aiText = "";
    try {
      const prompt = buildPrompt(text, mode, attempt);
      aiText = await generateText(prompt);
    } catch {
      continue;
    }

    if (!aiText) continue;

    let rewritten = cleanAIOutput(aiText);
    rewritten = humanizeDeterministic(rewritten);
    if (!rewritten) continue;

    // STEP 5: post-rewrite analysis
    const afterInsights = analyzeInsights(rewritten);
    const afterAI = await detectAI(rewritten);

    const candidate = {
      text: rewritten,
      aiScore: afterAI,
      insights: afterInsights
    };

    // STEP 6: pick best candidate
    if (!bestCandidate || candidate.aiScore < bestCandidate.aiScore) {
      bestCandidate = candidate;
    }

    // stop early if good enough
    if (candidate.aiScore < AI_THRESHOLD) break;
  }

  // STEP 7: fallback
  if (!bestCandidate) {
    return {
      status: "partial",
      output: humanizeDeterministic(text),
      retriesUsed,
      fallback: true
    };
  }

  // STEP 8: success response
  return {
    status: "success",
    mode,
    input: text,
    output: bestCandidate.text,
    retriesUsed,
    aiDetection: {
      before: beforeAI,
      after: bestCandidate.aiScore
    },
    insights: {
      before: beforeInsights,
      after: bestCandidate.insights
    }
  };
}

module.exports = { runParaphraser };
