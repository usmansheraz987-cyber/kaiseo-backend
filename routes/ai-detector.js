const express = require("express");
const router = express.Router();
const detectAI = require("../utils/aiContentDetector");

// EXISTING ENDPOINT — DO NOT TOUCH
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

// ✅ NEW ENDPOINT — COMPARE MODE
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

    return res.json({
      mode: "ai-content-detector-compare",
      confidence:
        original.split(/\s+/).length < 80 ||
        rewritten.split(/\s+/).length < 80
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
          : "No significant improvement detected."
    });
  } catch (err) {
    console.error("AI compare error:", err);
    return res.status(500).json({ error: "internal error" });
  }
});

module.exports = router;
