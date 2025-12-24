const engine = require("./engine");
const insightsEngine = require("./insights");

/* ---------------------------
   Shared helpers
---------------------------- */

function normalizeProbability(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function confidenceFromLength(text) {
  const words = text.trim().split(/\s+/).length;
  if (words < 40) return "low";
  if (words < 80) return "medium";
  return "high";
}

function verdictFromProbability(prob) {
  if (prob >= 70) return "ai";
  if (prob >= 40) return "mixed";
  return "human";
}

/* ---------------------------
   DETECT MODE
---------------------------- */

async function detect(req, res) {
  try {
    const { text } = req.body;

    if (!text || text.trim().length < 10) {
      return res.status(400).json({
        error: "Text too short for analysis"
      });
    }

    const analysis = engine.analyze(text);

    const aiProbability = normalizeProbability(analysis.aiProbability);
    const confidence = confidenceFromLength(text);
    const verdict = verdictFromProbability(aiProbability);

    return res.json({
      mode: "ai-content-detector",
      verdict,
      aiProbability,
      confidence,
      signals: analysis.signals || {},
      explanation:
        verdict === "ai"
          ? "Text shows strong AI-like structure and predictability."
          : verdict === "mixed"
          ? "Some AI-like structure detected, but human phrasing is present."
          : "Text appears naturally written with human variation."
    });
  } catch (err) {
    console.error("Detect error:", err);
    res.status(500).json({ error: "internal error" });
  }
}

/* ---------------------------
   COMPARE MODE
---------------------------- */

async function compare(req, res) {
  try {
    const { original, rewritten } = req.body;

    if (!original || !rewritten) {
      return res.status(400).json({
        error: "Both original and rewritten text are required"
      });
    }

    const before = engine.analyze(original);
    const after = engine.analyze(rewritten);

    const beforeProb = normalizeProbability(before.aiProbability);
    const afterProb = normalizeProbability(after.aiProbability);

    const improvementScore = normalizeProbability(beforeProb - afterProb);

    let summary;
    if (improvementScore >= 15) {
      summary = "Clear humanization improvement detected.";
    } else if (improvementScore >= 5) {
      summary = "Minor improvement detected.";
    } else {
      summary = "No meaningful structural change detected.";
    }

    return res.json({
      mode: "ai-content-detector-compare",
      before: beforeProb,
      after: afterProb,
      improvementScore,
      summary
    });
  } catch (err) {
    console.error("Compare error:", err);
    res.status(500).json({ error: "internal error" });
  }
}

/* ---------------------------
   INSIGHTS MODE
---------------------------- */

async function insights(req, res) {
  try {
    const { text } = req.body;

    if (!text || text.trim().length < 40) {
      return res.status(400).json({
        error: "Text too short for insights analysis"
      });
    }

    const result = insightsEngine.analyze(text);

    return res.json({
      mode: "ai-content-detector-insights",
      sentences: result.sentences || [],
      overallSuggestions:
        result.overallSuggestions && result.overallSuggestions.length
          ? result.overallSuggestions
          : [
              "Vary sentence length",
              "Reduce generic explanations",
              "Add personal or real-world context"
            ]
    });
  } catch (err) {
    console.error("Insights error:", err);
    res.status(500).json({ error: "internal error" });
  }
}

/* ---------------------------
   EXPORTS
---------------------------- */

module.exports = {
  detect,
  compare,
  insights
};
