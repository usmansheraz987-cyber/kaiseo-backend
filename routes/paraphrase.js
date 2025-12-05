// routes/paraphrase.js
const express = require("express");
const router = express.Router();
const { callOpenAI } = require("../utils/aiClient");

// Valid modes
const VALID_MODES = new Set([
  "humanize","rewrite","expand","shorten","grammar",
  "seo","formal","casual","academic","simplify"
]);

function localFallbackRewrite(text, mode) {
  if (!text) return "";
  switch (mode) {
    case "shorten":
      return text.split(" ").slice(0, 8).join(" ") + (text.split(" ").length > 8 ? "..." : "");
    case "expand":
      return text + " This adds a bit more explanation and detail for clarity.";
    case "humanize":
      return "In simple words, " + text.toLowerCase();
    case "grammar":
      return text.replace(/\bi\b/g, "I");
    case "seo":
      return text + " (SEO-optimized version)";
    case "formal":
      return "In a formal tone: " + text;
    case "casual":
      return "In a casual tone: " + text;
    case "academic":
      return "From an academic perspective: " + text;
    default:
      return text;
  }
}

function buildPrompt(text, mode) {
  // concise prompts per mode
  const instructions = {
    humanize: "Rewrite the text to sound natural and human. Keep meaning identical. Avoid jargon.",
    rewrite: "Rewrite the text improving clarity and flow while keeping the meaning identical.",
    expand: "Expand the text: add a sentence or two with useful details to clarify.",
    shorten: "Shorten the text while keeping the core meaning intact.",
    grammar: "Fix grammar, punctuation, and capitalization only.",
    seo: "Rewrite to be SEO-friendly: clearer, include keywords naturally, keep meaning.",
    formal: "Rewrite in a formal professional tone.",
    casual: "Rewrite in a casual friendly tone.",
    academic: "Rewrite in an academic, objective tone.",
    simplify: "Simplify the text, keep meaning but use plain words."
  };

  const instr = instructions[mode] || instructions.rewrite;
  // controlled prompt
  return `${instr}\n\nOriginal:\n${text}\n\nRewritten:`;
}

router.post("/", async (req, res) => {
  const { text, mode = "rewrite" } = req.body || {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Text is required" });
  }
  if (!VALID_MODES.has(mode)) {
    return res.status(400).json({ error: "Invalid mode", valid: Array.from(VALID_MODES) });
  }

  // Build prompt and call OpenAI
  const prompt = buildPrompt(text, mode);

  try {
    let aiOutput = null;
    if (process.env.OPENAI_API_KEY) {
      aiOutput = await callOpenAI(prompt);
    }

    if (!aiOutput) {
      // fallback local rewrite
      const fallbackText = localFallbackRewrite(text, mode);
      return res.json({ input: text, mode, output: fallbackText, fallback: true, details: "OpenAI failed or not configured." });
    }

    // trim and return
    const clean = aiOutput.trim();
    return res.json({ input: text, mode, output: clean, fallback: false });
  } catch (err) {
    console.error("paraphrase error:", err.message || err);
    const fallbackText = localFallbackRewrite(text, mode);
    return res.json({ input: text, mode, output: fallbackText, fallback: true, details: err.message || String(err) });
  }
});

module.exports = router;
