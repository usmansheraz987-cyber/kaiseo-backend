const generateKeywordSuggestions = require("../utils/keywordSuggestions");

router.post("/", async (req, res) => {
  const { keyword, context, competitors = [] } = req.body;

  if (!keyword) {
    return res.status(400).json({
      success: false,
      error: "Keyword is required"
    });
  }

  try {
    const data = await generateKeywordSuggestions(
      keyword,
      context,
      competitors
    );

    res.json({
      success: true,
      seed: keyword,
      suggestions: {
        primary: data.primary,
        longTail: data.longTail,
        questions: data.questions,
        related: data.related
      },
      insights: {
        intentMap: data.intentMap,
        difficultyHints: data.difficultyHints,
        competitorGaps: data.competitorGaps,
        dominationPlan: data.dominationPlan
      }
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "Failed to generate keyword strategy"
    });
  }
});
