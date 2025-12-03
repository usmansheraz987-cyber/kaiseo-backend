const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

// AI paraphrasing route
router.post("/", async (req, res) => {
  try {
    const { text, mode = "rewrite" } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Text is required" });
    }

    // MODE PROMPTS
    const prompts = {
      rewrite: `Rewrite the text clearly:\n\n${text}`,
      humanize: `Rewrite this text so it sounds fully human and natural, not AI-like:\n\n${text}`,
      expand: `Expand this text with more depth and clarity:\n\n${text}`,
      shorten: `Shorten this text but keep the meaning:\n\n${text}`,
      grammar: `Fix grammar and clarity without changing meaning:\n\n${text}`,
      formal: `Rewrite the text in a formal professional tone:\n\n${text}`,
      casual: `Rewrite this text in a relaxed casual tone:\n\n${text}`,
      academic: `Rewrite this text in an academic, research-style tone:\n\n${text}`,
      "seo-friendly": `Rewrite this text to be SEO-friendly, improve keywords naturally:\n\n${text}`,
      summarize: `Summarize this text briefly:\n\n${text}`
    };

    const prompt = prompts[mode] || prompts["rewrite"];

    // AI CALL (OpenAI or compatible API)
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a rewriting assistant." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();
    if (!data.choices) {
      throw new Error("AI returned no response");
    }

    const output = data.choices[0].message.content;

    res.json({
      input: text,
      mode,
      output
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to paraphrase",
      details: err.message
    });
  }
});

module.exports = router;
