// routes/paraphrase.js
const express = require("express");
const router = express.Router();
const { generateParaphrase } = require("../utils/aiClient");

// local simple fallback (keeps your existing behavior)
function localFallbackRewrite(text = "", mode = "rewrite") {
  if (!text) return "";
  switch (mode) {
    case "shorten":
      return text.split(" ").slice(0, 8).join(" ") + (text.split(" ").length > 8 ? "..." : "");
    case "expand":
      return text + " This adds a bit more explanation for clarity.";
    case "humanize":
      return "In simple words, " + text.toLowerCase();
    case "grammar":
      return text.replace(/\bi\b/g, "I");
    case "formal":
      return text; // keep same for fallback
    case "casual":
      return text; // keep same for fallback
    case "seo":
      return text; // keep same for fallback
    default:
      return text;
  }
}

const VALID_MODES = new Set([
  "humanize","rewrite","expand","shorten","grammar","seo",
  "formal","casual","academic","simple"
]);

router.post("/", async (req, res) => {
  try {
    const { text, mode = "rewrite", temperature } = req.body || {};
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }
    const modeKey = VALID_MODES.has(mode) ? mode : "rewrite";

    // Try AI first
    try {
      const aiResult = await generateParaphrase(text, modeKey, { temperature });
      return res.json({ input: text, mode: modeKey, output: aiResult });
    } catch (aiErr) {
      // AI failed or missing key -- fallback gracefully and return explanation
      const fallback = localFallbackRewrite(text, modeKey);
      return res.json({
        input: text,
        mode: modeKey,
        output: fallback,
        fallback: true,
        details: aiErr && aiErr.message ? aiErr.message : "AI unavailable"
      });
    }
  } catch (err) {
    console.error("paraphrase route error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
