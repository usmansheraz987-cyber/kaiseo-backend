const express = require("express");
const router = express.Router();
const readability = require("../utils/readability");

router.post("/", async (req, res) => {
  try {
    const text = req.body.text || "";
    if (!text.trim()) {
      return res.status(400).json({ ok: false, error: "Text is required" });
    }

    const result = readability.analyze(text);

    return res.json({
      ok: true,
      readability: result
    });

  } catch (err) {
    console.error("Readability error:", err);
    return res.status(500).json({ ok: false, error: "internal error" });
  }
});

module.exports = router;
