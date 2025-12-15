const express = require("express");
const analyzeMetaTags = require("../utils/metaTagAnalyzer");

const router = express.Router();

router.post("/", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: "URL is required"
    });
  }

  try {
    const analysis = await analyzeMetaTags(url);

    const suggestions = [];

    if (analysis.title.status !== "good") {
      suggestions.push(
        "Optimize title length to 50–60 characters."
      );
    }

    if (analysis.description.status !== "good") {
      suggestions.push(
        "Write a compelling meta description (120–160 chars)."
      );
    }

    if (analysis.canonical === "not-set") {
      suggestions.push(
        "Add a canonical tag to avoid duplication issues."
      );
    }

    if (!analysis.openGraph["og:title"]) {
      suggestions.push(
        "Add Open Graph tags for social sharing."
      );
    }

    res.json({
      success: true,
      analysis,
      suggestions
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch or analyze URL"
    });
  }
});

module.exports = router;
