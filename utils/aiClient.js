const { Configuration, OpenAIApi } = require("openai");

const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
let openaiClient = null;

if (OPENAI_KEY) {
  const configuration = new Configuration({ apiKey: OPENAI_KEY });
  openaiClient = new OpenAIApi(configuration);
}

function safeArray(arr) {
  return Array.isArray(arr) ? arr : [];
}

/**
 * TEXT GENERATION (for paraphraser, humanizer, etc.)
 */
async function generateText(prompt, options = {}) {
  if (!openaiClient) {
    throw new Error("OpenAI client not available");
  }

  const resp = await openaiClient.createChatCompletion({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a professional human editor." },
      { role: "user", content: prompt }
    ],
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 800
  });

  return resp.data.choices[0].message.content;
}

/**
 * JSON GENERATION (used by SEO tools)
 */
async function generateJson(prompt) {
  if (!openaiClient) {
    throw new Error("OpenAI client not available");
  }

  const resp = await openaiClient.createChatCompletion({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Return valid JSON only." },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
    max_tokens: 800
  });

  return resp.data.choices[0].message.content;
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

  if (!openaiClient) return minimal;

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
