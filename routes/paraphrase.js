// routes/paraphrase.js

const express = require("express");
const router = express.Router();

// 🔹 Import the orchestrator (the brain)
const { runParaphraser } = require("../src/services/orchestrator");

// ===============================
// PARAPHRASE ROUTE (v2)
// ===============================
router.post("/", async (req, res) => {
  try {
    const { text, mode = "human" } = req.body || {};

    // Call orchestrator
    const result = await runParaphraser({
      text,
      mode
    });

    // Validation error from orchestrator
    if (result.status === "error") {
      return res.status(400).json(result);
    }

    // Success or partial (fallback)
    return res.json(result);

  } catch (error) {
    console.error("Paraphraser route error:", error);

    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
});

module.exports = router;
