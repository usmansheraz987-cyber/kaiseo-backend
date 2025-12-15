const express = require("express");
const generateKeywordSuggestions = require("../utils/keywordSuggestions");

const router = express.Router();

router.post("/", async (req, res) => {
  const { keyword, context } = req.body;

  if (!keyword) {
    return res.status(400).json({
      success: false,
      error: "Keyword is required"
    });
  }

  try {
    const suggestions = await generateKeywordSuggestions(
      keyword,
      context
    );

    res.json({
      success: true,
      seed: keyword,
      suggestions
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Failed to generate keyword suggestions"
    });
  }
});

module.exports = router;
