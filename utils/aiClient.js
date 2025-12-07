// utils/aiClient.js
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "" // Render / system env must contain this
});

async function callOpenAI(prompt) {
  // Use Responses API
  const res = await client.responses.create({
    model: "gpt-4o-mini", // change model if needed / available on your account
    input: prompt,
    max_output_tokens: 4000
  });

  // Responses API nested shape: pick the text
  // defensive access:
  try {
    const text = (res.output && res.output[0] && res.output[0].content && res.output[0].content[0] && res.output[0].content[0].text)
      || (res.output_text) // older responses
      || JSON.stringify(res);
    return text;
  } catch (err) {
    return null;
  }
}

// === Advanced SEO Insight Generator ===
async function generateSeoInsights({ title, metaDescription, keywords, wordText }) {
  try {
    const prompt = `
You are an expert SEO consultant. Analyze the following webpage content and provide a structured SEO improvement report.
Return ONLY valid JSON. No explanations.

DATA:
Title: ${title || "null"}
Meta Description: ${metaDescription || "null"}
Top Keywords: ${JSON.stringify(keywords || [])}
Content Snippet: ${wordText ? wordText.slice(0, 1200) : ""}

JSON FORMAT:
{
  "rewrittenTitle": "",
  "rewrittenMeta": "",
  "suggestedH1": "",
  "suggestedSubheadings": [],
  "contentGaps": [],
  "semanticKeywords": [],
  "internalLinkSuggestions": [],
  "toneAndReadabilityAdvice": "",
  "priorityFixes": []
}
    `;

    const res = await client.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
      max_output_tokens: 600
    });

    let raw = res.output_text || "";

    try {
      return JSON.parse(raw);
    } catch (err) {
      const match = raw.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : {};
    }
  } catch (error) {
    console.error("SEO Insight Error:", error);
    return {};
  }
}


module.exports = { 
  callOpenAI,
  generateSeoInsights
};

