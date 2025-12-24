// src/tools/ai-detector/controller.js

const engine = require("./engine");
const validator = require("./validator");
const scorer = require("./scorer");
const insights = require("./insights");

/**
 * Single text AI detection
 */
async function detect(text) {
  // 1. Validate input
  const error = validator.validateText(text);
  if (error) {
    return {
      error: error,
    };
  }

  // 2. Extract signals
  const signals = engine.analyze(text);

  // 3. Score content
  const score = scorer.calculate(signals);

  return {
    verdict: score.verdict,
    aiProbability: score.aiProbability,
    confidence: score.confidence,
    signals,
    explanation: score.explanation,
  };
}

/**
 * Compare original vs rewritten text
 */
async function compare(original, rewritten) {
  // 1. Validate inputs
  const originalError = validator.validateText(original);
  const rewrittenError = validator.validateText(rewritten);

  if (originalError || rewrittenError) {
    return {
      error: "Both original and rewritten text must be at least 50 words",
    };
  }

  // 2. Run detection on both
  const originalResult = await detect(original);
  const rewrittenResult = await detect(rewritten);

  // 3. Safety check (prevents 500 crash)
  if (originalResult.error || rewrittenResult.error) {
    return {
      error: "Comparison failed due to invalid analysis",
    };
  }

  // 4. Calculate improvements
  const improvement = {
    aiProbabilityChange:
      originalResult.aiProbability - rewrittenResult.aiProbability,

    sentenceVarianceChange:
      rewrittenResult.signals.sentenceVariance -
      originalResult.signals.sentenceVariance,

    vocabularyRichnessChange:
      rewrittenResult.signals.vocabularyRichness -
      originalResult.signals.vocabularyRichness,
  };

  return {
    mode: "ai-content-detector-compare",
    original: {
      aiProbability: originalResult.aiProbability,
      verdict: originalResult.verdict,
    },
    rewritten: {
      aiProbability: rewrittenResult.aiProbability,
      verdict: rewrittenResult.verdict,
    },
    improvement,
  };
}

/**
 * Insight-only mode (no scoring)
 */
async function analyzeInsights(text) {
  const error = validator.validateText(text);
  if (error) {
    return {
      error: error,
    };
  }

  const signals = engine.analyze(text);
  const insightData = insights.generate(signals);

  return {
    mode: "ai-content-detector-insights",
    sentences: insightData.sentences,
    overallSuggestions: insightData.overallSuggestions,
  };
}

module.exports = {
  detect,
  compare,
  insights: analyzeInsights,
};
