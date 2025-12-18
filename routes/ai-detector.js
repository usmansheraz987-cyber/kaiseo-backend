// routes/ai-detector.js

const express = require("express");
const router = express.Router();
const detectAI = require("../utils/aiContentDetector");

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

module.exports = router;
