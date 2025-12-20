const OpenAI = require("openai");

const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
let openai = null;

if (OPENAI_KEY) {
  openai = new OpenAI({
    apiKey: OPENAI_KEY
  });
}

function safeArray(arr) {
  return Array.isArray(arr) ? arr : [];
}

/**
 * TEXT GENERATION (paraphraser, humanizer, etc.)
 */
async function generateText(prompt, options = {}) {
  if (!openai) {
    throw new Error("OpenAI client not available");
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a professional human editor." },
      { role: "user", content: prompt }
    ],
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 800
  });

  return response.choices[0].message.content;
}

/**
 * JSON GENERATION (SEO tools)
 */
async function generateJson(prompt) {
  if (!openai) {
    throw new Error("OpenAI client not available");
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Return valid JSON only." },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
    max_tokens: 800
  });

  return response.choices[0].message.content;
}

/**
 * Existing SEO Content Improver logic (unchanged)
 */
async function generateSeoInsights({
  title,
  metaDescription,
  keywords,
  wordText,
  competitors
}) {
  keywords = safeArray(keywords);
  competitors = safeArray(competitors);

  const minimal = {
    rewrittenTitle: title ? `${title} — Improve and optimize` : null,
    rewrittenMeta: metaDescription || null,
    suggestedH1: title || null,
    suggestedSubheadings: [],
    contentGaps: [],
    semanticKeywords: keywords.slice(0, 10),
    internalLinkSuggestions: [],
    competitorInsights: {
      averageLength: 0,
      commonKeywords: [],
      missingOpportunities: [],
      top3Takeaways: []
    },
    toneAndReadabilityAdvice: "",
    priorityFixes: []
  };

  if (!openai) return minimal;

  try {
    const aiText = await generateJson("Generate SEO insights as JSON.");
    return JSON.parse(aiText);
  } catch {
    return minimal;
  }
}

module.exports = {
  generateText,
  generateJson,
  generateSeoInsights
};
