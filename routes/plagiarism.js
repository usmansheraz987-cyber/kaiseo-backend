// routes/plagiarism.js

const express = require("express");
const router = express.Router();
const plagiarismChecker = require("../utils/plagiarismChecker");

router.post("/", async (req, res) => {
  const text = req.body?.text || "";

  if (!text) {
    return res.status(400).json({
      ok: false,
      error: "text is required"
    });
  }

  try {
    const result = await plagiarismChecker.check(text);

    return res.json({
      ok: true,
      plagiarism: result
    });

  } catch (err) {
    console.error("Plagiarism route error:", err);
    return res.status(500).json({
      ok: false,
      error: "internal error"
    });
  }
});

module.exports = router;
