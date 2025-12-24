// src/services/tools/ai-detector/controller.js

const {
  detectAIEngine,
  compareAIEngine,
  insightEngine
} = require("./engine");

/* -----------------------------
   Helpers
----------------------------- */

function wordCount(text) {
  return text.trim().split(/\s+/).length;
}

function safeText(text) {
  return typeof text === "string" && text.trim().length > 0;
}

function confidenceFromProbability(p) {
  if (p >= 75) return "high";
  if (p >= 45) return "medium";
  return "low";
}

/* -----------------------------
   DETECT MODE
----------------------------- */
async function detect(req, res) {
  try {
    const { text } = req.body;

    if (!safeText(text)) {
      return res.status(400).json({
        mode: "ai-content-detector",
        error: "Text is required"
      });
    }

    if (wordCount(text) < 50) {
      return res.json({
        mode: "ai-content-detector",
        verdict: "uncertain",
        aiProbability: 0,
        confidence: "low",
        explanation: "Text too short for reliable AI detection"
      });
    }

    const result = detectAIEngine(text);

    return res.json({
      mode: "ai-content-detector",
      verdict: result.verdict,
      aiProbability: result.aiProbability,
      confidence: confidenceFromProbability(result.aiProbability),
      signals: result.signals,
      explanation: result.explanation
    });

  } catch (err) {
    console.error("AI Detect Error:", err);
    return res.status(500).json({
      mode: "ai-content-detector",
      error: "internal error"
    });
  }
}

/* -----------------------------
   COMPARE MODE
----------------------------- */
async function compare(req, res) {
  try {
    const { original, rewritten } = req.body;

    if (!safeText(original) || !safeText(rewritten)) {
      return res.status(400).json({
        mode: "ai-content-detector-compare",
        error: "Both original and rewritten text are required"
      });
    }

    if (wordCount(original) < 30 || wordCount(rewritten) < 30) {
      return res.json({
        mode: "ai-content-detector-compare",
        confidence: "low",
        before: null,
        after: null,
        improvementScore: 0,
        summary: "Text too short for meaningful comparison"
      });
    }

    const result = compareAIEngine(original, rewritten);

    const improvement =
      result.before.aiProbability - result.after.aiProbability;

    return res.json({
      mode: "ai-content-detector-compare",
      confidence: confidenceFromProbability(result.after.aiProbability),
      before: result.before,
      after: result.after,
      improvementScore: Math.max(improvement, 0),
      summary:
        improvement > 0
          ? "Human-likeness improved after rewriting"
          : "No meaningful structural improvement detected"
    });

  } catch (err) {
    console.error("AI Compare Error:", err);
    return res.status(500).json({
      mode: "ai-content-detector-compare",
      error: "internal error"
    });
  }
}

/* -----------------------------
   INSIGHTS MODE
----------------------------- */
async function insights(req, res) {
  try {
    const { text } = req.body;

    if (!safeText(text)) {
      return res.status(400).json({
        mode: "ai-content-detector-insights",
        error: "Text is required"
      });
    }

    if (wordCount(text) < 40) {
      return res.json({
        mode: "ai-content-detector-insights",
        sentences: [],
        overallSuggestions: [
          "Increase text length for deeper analysis",
          "Add personal experience or examples",
          "Avoid overly generic statements"
        ]
      });
    }

    const result = insightEngine(text);

    // 🔑 CRITICAL FIX: never return empty insights
    if (!result.sentences || result.sentences.length === 0) {
      return res.json({
        mode: "ai-content-detector-insights",
        sentences: [],
        overallSuggestions: [
          "Vary sentence length",
          "Reduce generic definitions",
          "Add personal context",
          "Include real-world outcomes or data"
        ]
      });
    }

    return res.json({
      mode: "ai-content-detector-insights",
      sentences: result.sentences,
      overallSuggestions: result.overallSuggestions.length
        ? result.overallSuggestions
        : [
            "Improve sentence flow",
            "Reduce repetitive phrasing",
            "Add human-style transitions"
          ]
    });

  } catch (err) {
    console.error("AI Insights Error:", err);
    return res.status(500).json({
      mode: "ai-content-detector-insights",
      error: "internal error"
    });
  }
}

/* -----------------------------
   EXPORTS
----------------------------- */
module.exports = {
  detect,
  compare,
  insights
};
