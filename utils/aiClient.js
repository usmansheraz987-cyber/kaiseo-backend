const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
});

// === CALL SIMPLE OPENAI TEXT ===
async function callOpenAI(prompt) {
  const res = await client.responses.create({
    model: "gpt-4o-mini",
    input: prompt,
    max_output_tokens: 4000
  });

  try {
    const text =
      (res.output &&
        res.output[0] &&
        res.output[0].content &&
        res.output[0].content[0] &&
        res.output[0].content[0].text) ||
      res.output_text ||
      JSON.stringify(res);

    return text;
  } catch (err) {
    return null;
  }
}

// === ADVANCED SEO + COMPETITOR INSIGHTS ===
async function generateSeoInsights({ title, metaDescription, keywords, wordText, competitors }) {
  try {
    const prompt = `
You are an advanced SEO consultant. Analyze the webpage content below
AND the competitor SERP data. Return ONLY VALID JSON.

DATA:
Title: ${title || "null"}
MetaDescription: ${metaDescription || "null"}
Top Keywords: ${JSON.stringify(keywords || [])}
Competitors: ${JSON.stringify(competitors || [])}
Content Sample: ${wordText ? wordText.slice(0, 1200) : ""}

Your JSON response must follow this format:

{
  "rewrittenTitle": "",
  "rewrittenMeta": "",
  "suggestedH1": "",
  "suggestedSubheadings": [],
  "contentGaps": [],
  "semanticKeywords": [],
  "internalLinkSuggestions": [],
  "competitorInsights": {
        "averageLength": 0,
        "commonKeywords": [],
        "missingOpportunities": [],
        "top3Takeaways": []
  },
  "toneAndReadabilityAdvice": "",
  "priorityFixes": []
}
`;

    const res = await client.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
      max_output_tokens: 900
    });

    let raw = res.output_text || "";

    try {
      return JSON.parse(raw);
    } catch (err) {
      const match = raw.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : {};
    }
  } catch (err) {
    console.error("AI Insight Error:", err);
    return {};
  }
}

module.exports = {
  callOpenAI,
  generateSeoInsights
};
