const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

router.post("/", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Text is required" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OpenAI API Key" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Rewrite this text in a clearer, natural way." },
          { role: "user", content: text }
        ]
      })
    });

    const data = await response.json();

    if (!data || !data.choices || !data.choices[0]) {
      return res.status(500).json({ 
        error: "Failed to paraphrase", 
        details: "AI returned no response" 
      });
    }

    res.json({
      input: text,
      output: data.choices[0].message.content
    });

  } catch (err) {
    console.error("Paraphrase error:", err);
    res.status(500).json({ error: "Paraphraser crashed", details: err.message });
  }
});

module.exports = router;
