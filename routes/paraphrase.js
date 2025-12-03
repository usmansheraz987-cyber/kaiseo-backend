const express = require("express");
const router = express.Router();

// SIMPLE NON-AI REWRITER (placeholder until we add AI)
function rewrite(text, mode) {
  if (!text) return "";

  switch (mode) {
    case "shorten":
      return text.split(" ").slice(0, 8).join(" ") + "...";

    case "expand":
      return text + " This adds more explanation for clarity.";

    case "humanize":
      return "In simple words, " + text.toLowerCase();

    case "grammar":
      return text.replace(/\si\s/g, " I ");

    default:
      return text;
  }
}

router.post("/", async (req, res) => {
  try {
    const { text, mode = "default" } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Text is required" });
    }

    // Run simple placeholder rewrite
    const output = rewrite(text, mode);

    res.json({
      input: text,
      mode,
      output
    });

  } catch (err) {
    res.status(500).json({
      error: "Failed to paraphrase",
      details: err.message
    });
  }
});

module.exports = router;
