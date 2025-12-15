const { generateJson } = require("./aiClient");

async function generateKeywordSuggestions(keyword, context = "") {
  const prompt = `
You are an SEO keyword research assistant.

Generate keyword suggestions for the seed keyword:
"${keyword}"

Context:
${context || "general SEO"}

Return ONLY valid JSON in the following structure:
{
  "primary": [],
  "longTail": [],
  "questions": [],
  "related": []
}

Rules:
- Output valid JSON only
- No explanations
- No markdown
- No extra text
- 5 to 8 items per array
- Keywords must be realistic and search-intent focused
`;

  const responseText = await generateJson(prompt);

  let parsed;

  try {
    parsed = JSON.parse(responseText);
  } catch (err) {
    // Attempt to extract JSON if model wrapped it
    const match = responseText.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Invalid AI response format");
    }
    parsed = JSON.parse(match[0]);
  }

  return {
    primary: Array.isArray(parsed.primary) ? parsed.primary : [],
    longTail: Array.isArray(parsed.longTail) ? parsed.longTail : [],
    questions: Array.isArray(parsed.questions) ? parsed.questions : [],
    related: Array.isArray(parsed.related) ? parsed.related : []
  };
}

module.exports = generateKeywordSuggestions;
