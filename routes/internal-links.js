// routes/internal-links.js

const express = require("express");
const router = express.Router();
const { analyzeInternalLinks } = require("../utils/internalLinker");

router.post("/", async (req, res) => {
  try {
    const { url, domain } = req.body || {};

    if (!url) {
      return res.status(400).json({
        ok: false,
        error: "url is required"
      });
    }

    const result = await analyzeInternalLinks({ url, domain });

    return res.json(result);
  } catch (err) {
    console.error("Internal links error:", err && err.message ? err.message : err);
    return res.status(500).json({
      ok: false,
      error: "internal_error",
      details: err.message || String(err)
    });
  }
});

module.exports = router;
