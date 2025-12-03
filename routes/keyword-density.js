const express = require("express");
const router = express.Router();

function normalizeWord(word) {
  return word.toLowerCase().replace(/[^a-z0-9\-]/g, "");
}

router.post("/", (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  const words = text
    .split(/\s+/)
    .map(normalizeWord)
    .filter((w) => w.length > 0);

  const totalWords = words.length;

  const frequency = {};
  words.forEach((word) => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  const keywordList = Object.entries(frequency).map(([word, count]) => {
    return { word, count, density: ((count / totalWords) * 100).toFixed(2) };
  });

  const stuffingWarnings = keywordList.filter((k) => k.density > 3);

  res.json({
    totalWords,
    keywordCount: keywordList.length,
    keywords: keywordList.sort((a, b) => b.count - a.count),
    stuffingWarnings,
  });
});

module.exports = router;
