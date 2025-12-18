// routes/title-meta-generator.js

const express = require("express");
const router = express.Router();
const { generate } = require("../utils/title-meta-generator");

router.post("/", (req, res) => {
  try {
    const { topic = "", keywords = [] } = req.body;

    if (!topic.trim()) {
      return res.status(400).json({ error: "Topic is required" });
    }

    const result = generate({ topic, keywords });
    return res.json(result);

  } catch (err) {
    console.error("title meta generator error:", err);
    return res.status(500).json({ error: "internal error" });
  }
});

module.exports = router;
