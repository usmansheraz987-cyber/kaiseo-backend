// utils/aiClient.js
const axios = require('axios');

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
let openaiClient = null;

try {
  if (OPENAI_KEY) {
    const { Configuration, OpenAIApi } = require('openai');
    const configuration = new Configuration({ apiKey: OPENAI_KEY });
    openaiClient = new OpenAIApi(configuration);
  }
} catch (e) {
  // openai package not installed or other error, we'll fall back to simple heuristics below
  openaiClient = null;
}

function safeArray(arr) {
  return Array.isArray(arr) ? arr : [];
}

async function callOpenAIChat(prompt) {
  // prompt is a string asking for JSON output
  if (!openaiClient) throw new Error('OpenAI client not available');
  const system = "You are an assistant that returns a JSON object only. Use valid JSON.";
  // we ask model to return JSON only
  const resp = await openaiClient.createChatCompletion({
    model: 'gpt-4o-mini', // fallback: if not available, provider will error. You can change to 'gpt-4o' or 'gpt-4o-mini' according to your plan.
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3,
    max_tokens: 800
  });
  const txt = resp.data && resp.data.choices && resp.data.choices[0].message && resp.data.choices[0].message.content;
  return txt;
}

// Generate a small insights object
async function generateSeoInsights({ title, metaDescription, keywords, wordText, competitors }) {
  keywords = safeArray(keywords);
  competitors = safeArray(competitors);

  const minimal = {
    rewrittenTitle: title ? `${title} — Improve and optimize` : null,
    rewrittenMeta: metaDescription || null,
    suggestedH1: title || null,
    suggestedSubheadings: [],
    contentGaps: [],
    semanticKeywords: keywords.slice(0, 10).map(k => (typeof k === 'string' ? k : k.keyword || '').toString()).filter(Boolean),
    internalLinkSuggestions: [],
    competitorInsights: {
      averageLength: 0,
      commonKeywords: [],
      missingOpportunities: [],
      top3Takeaways: []
    },
    toneAndReadabilityAdvice: '',
    priorityFixes: []
  };

  // Quick heuristic if there's no openai key or client
  if (!openaiClient) {
    // Populate heuristics from competitors and keywords
    const avgLen = competitors.length ? Math.round((competitors.reduce((s, c) => s + (c.contentLength || 0), 0) / competitors.length)) : 0;
    minimal.competitorInsights.averageLength = avgLen;
    minimal.competitorInsights.commonKeywords = keywords.slice(0, 10).map(k => (k.keyword ? k.keyword : k)).filter(Boolean);
    minimal.competitorInsights.top3Takeaways = competitors.slice(0, 3).map(c => c.title || c.domain || c.link);
    minimal.suggestedSubheadings = ['Introduction', 'Why it matters', 'How to choose', 'Conclusion'];
    minimal.contentGaps = ['Add examples', 'Add case studies', 'Include data/benchmarks'];
    minimal.toneAndReadabilityAdvice = 'Keep short paragraphs, use H2/H3 subheads, add examples for clarity.';
    minimal.priorityFixes = ['Add meta description', 'Add descriptive H1', 'Add more content depth'];
    return minimal;
  }

  // Build prompt asking for JSON
  const prompt = `
You are an SEO assistant. Analyze the following content and competitors and output a valid JSON object (no extra text).

Inputs:
Title: ${title || ''}
MetaDescription: ${metaDescription || ''}
Top keywords: ${Array.isArray(keywords) ? JSON.stringify(keywords) : String(keywords)}
Content (short): ${(wordText || '').slice(0, 1200)}

Competitors: ${JSON.stringify(competitors.slice(0, 6))}

Return JSON with these fields:
{
  "rewrittenTitle": string|null,
  "rewrittenMeta": string|null,
  "suggestedH1": string|null,
  "suggestedSubheadings": [string],
  "contentGaps": [string],
  "semanticKeywords": [string],
  "internalLinkSuggestions": [string],
  "competitorInsights": {
     "averageLength": number,
     "commonKeywords": [string],
     "missingOpportunities": [string],
     "top3Takeaways": [string]
  },
  "toneAndReadabilityAdvice": string,
  "priorityFixes": [string]
}

Make reasonable guesses from inputs if information is missing. Keep arrays short (max 8 items). Use plain text. Only output valid JSON.
`;

  try {
    const aiText = await callOpenAIChat(prompt);
    // Try parse JSON directly
    try {
      const parsed = JSON.parse(aiText);
      return parsed;
    } catch (e) {
      // attempt to extract JSON substring
      const match = aiText.match(/\{[\s\S]*\}$/);
      if (match) {
        return JSON.parse(match[0]);
      }
      // fallback
      return minimal;
    }
  } catch (e) {
    console.warn('generateSeoInsights OpenAI error', e && e.message ? e.message : e);
    return minimal;
  }
}

module.exports = {
  generateSeoInsights
};
