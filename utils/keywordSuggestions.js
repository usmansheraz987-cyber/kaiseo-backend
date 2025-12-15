const aiClient = require("./aiClient");

async function generateKeywordSuggestions(keyword, context = "") {
  const prompt = `
You are an SEO keyword research assistant.

Generate keyword suggestions for:
"${keyword}"

Context: ${context || "general SEO"}

Return ONLY valid JSON in this structure:
{
  "primary": [],
  "longTail": [],
  "questions": [],
  "related": []
}

Rules:
- No explanations
- No markdown
- No extra text
- 5–8 items per array
`;

  const response = await aiClient(prompt);

  return JSON.parse(response);
}

module.exports = generateKeywordSuggestions;
