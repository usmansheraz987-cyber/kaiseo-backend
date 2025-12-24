// tools/ai-detector/controller.js

const { validateText, getConfidence } = require("./validator");
const { analyzeText } = require("./engine");
const { scoreResult } = require("./scorer");
const { analyzeInsights } = require("./insights");

async function detect(text) {
  const cleanText = validateText(text);

  const metrics = analyzeText(cleanText);
  const confidence = getConfidence(metrics.wordCount);

  return scoreResult(metrics, cleanText, confidence);
}

async function compare(original, rewritten) {
  const before = await detect(original);
  const after = await detect(rewritten);

  const improvementScore = Math.max(
    0,
    before.aiProbability - after.aiProbability
  );

  return {
    confidence:
      before.confidence === "low" || after.confidence === "low"
        ? "low"
        : "medium",
    before: {
      aiProbability: before.aiProbability,
      verdict: before.verdict
    },
    after: {
      aiProbability: after.aiProbability,
      verdict: after.verdict
    },
    improvementScore,
    summary:
      improvementScore > 0
        ? "AI probability reduced after rewrite."
        : "No structural change detected."
  };
}

function insights(text) {
  const cleanText = validateText(text);
  return analyzeInsights(cleanText);
}

module.exports = {
  detect,
  compare,
  insights
};
