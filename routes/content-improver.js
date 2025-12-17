// routes/content-improver.js

const express = require("express");
const router = express.Router();

const { analyzeContent } = require("../utils/content-improver");

router.post("/", (req, res) => {
  try {
    const { text = "", title = "", metaDescription = "" } = req.body;

    if (!text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }

    const result = analyzeContent({ text, title, metaDescription });
    return res.json(result);
  } catch (err) {
    console.error("content improver error:", err);
    return res.status(500).json({ error: "internal error" });
  }
});

module.exports = router;
