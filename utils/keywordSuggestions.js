const { generateJson } = require("./aiClient");

async function generateKeywordSuggestions(keyword, context = "", competitors = []) {
  const competitorText = competitors.length
    ? `Competitors to consider:\n${competitors.join(", ")}`
    : "No competitors provided.";

  const prompt = `
You are an advanced SEO strategist.

Seed keyword:
"${keyword}"

Context:
${context || "general SEO"}

${competitorText}

Return ONLY valid JSON using this structure:
{
  "primary": [],
  "longTail": [],
  "questions": [],
  "related": [],
  "intentMap": [
    { "keyword": "", "intent": "" }
  ],
  "difficultyHints": [
    { "keyword": "", "difficulty": "" }
  ],
  "competitorGaps": {
    "missingTopics": [],
    "weakCoverage": [],
    "opportunityAngles": []
  },
  "dominationPlan": {
    "bestPrimaryKeyword": "",
    "recommendedContentType": "",
    "sectionsToInclude": [],
    "internalLinkIdeas": []
  }
}

Rules:
- Valid JSON only
- No explanations
- No markdown
- Base competitor gaps on typical coverage of provided domains
- Focus on realistic SEO opportunities
`;

  const response = await generateJson(prompt);
  return JSON.parse(response);
}

module.exports = generateKeywordSuggestions;
