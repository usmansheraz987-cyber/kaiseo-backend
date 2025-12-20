const { generateText } = require("../../utils/aiClient");
const analyzeInsights = require("../../utils/aiInsightsEngine");
const detectAI = require("../../utils/aiContentDetector");

const MAX_TEXT_LENGTH = 5000;
const MAX_RETRIES = 2;
const AI_THRESHOLD = 55;

function isTextValid(text) {
  if (!text || typeof text !== "string") return false;
  if (text.trim().length < 20) return false;
  if (text.length > MAX_TEXT_LENGTH) return false;
  return true;
}

function cleanAIOutput(text) {
  return text.replace(/\n+/g, " ").trim();
}

function humanizeDeterministic(text) {
  return text
    .replace(/\bFurthermore\b|\bMoreover\b|\bIn addition\b/gi, "Also")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function buildPrompt(text, mode, retry) {
  let rules = `
Rewrite the text naturally.
Keep the meaning identical.
Do not explain anything.
Return ONLY the rewritten text.
`;

  if (retry > 0 || mode === "anti-ai") {
    rules += `
Avoid predictable phrasing.
Vary sentence length.
Sound human.
`;
  }

  return `${rules}\n\nText:\n${text}`;
}

async function runParaphraser({ text, mode = "human" }) {
  if (!isTextValid(text)) {
    return { status: "error", message: "Invalid text" };
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
      aiText = await generateText(prompt);
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
