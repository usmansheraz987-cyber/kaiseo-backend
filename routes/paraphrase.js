// routes/paraphrase.js

const express = require("express");
const router = express.Router();

const { runParaphraser } = require("../src/services/orchestrator");

router.post("/", async (req, res) => {
  try {
    const { text, mode = "human" } = req.body || {};
    const result = await runParaphraser({ text, mode });

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err) {
    console.error("Paraphrase route error:", err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
});

module.exports = router;
