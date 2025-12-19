const express = require("express");
const router = express.Router();
const detectAI = require("../utils/aiContentDetector");

// SINGLE TEXT DETECTION
router.post("/", async (req, res) => {
  try {
    const { text = "" } = req.body;

    if (!text || text.trim().length < 50) {
      return res.status(400).json({
        error: "Text too short for AI detection (minimum 50 words)"
      });
    }

    const result = await detectAI(text);

    return res.json({
      mode: "ai-content-detector",
      ...result
    });
  } catch (err) {
    console.error("AI detector error:", err);
    return res.status(500).json({ error: "internal error" });
  }
});

// COMPARE MODE
router.post("/compare", async (req, res) => {
  try {
    const { original = "", rewritten = "" } = req.body;

    if (!original || !rewritten) {
      return res.status(400).json({
        error: "Both original and rewritten text are required"
      });
    }

    const before = await detectAI(original);
    const after = await detectAI(rewritten);

    const improvementScore = Math.max(
      0,
      before.aiProbability - after.aiProbability
    );

    let summary =
      improvementScore > 0
        ? "AI probability reduced after rewrite."
        : "No structural change detected.";

    if (before.confidence === "low" || after.confidence === "low") {
      summary =
        "Text is too short for reliable comparison. Add more content for clearer results.";
    }

    return res.json({
      mode: "ai-content-detector-compare",
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
      summary
    });
  } catch (err) {
    console.error("AI compare error:", err);
    return res.status(500).json({ error: "internal error" });
  }
});

module.exports = router;
