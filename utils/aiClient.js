// utils/aiClient.js
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
});

// simple helper to extract text safely
function safeText(x) {
  if (!x) return "";
  if (typeof x === "string") return x;
  try { return JSON.stringify(x); } catch (e) { return String(x); }
}

/**
 * callOpenAI - general wrapper (kept for compatibility)
 */
async function callOpenAI(prompt) {
  const res = await client.responses.create({
    model: "gpt-4o-mini",
    input: prompt,
    max_output_tokens: 4000
  });

  try {
    const text = (res.output && res.output[0] && res.output[0].content && res.output[0].content[0] && res.output[0].content[0].text)
      || (res.output_text)
      || JSON.stringify(res);
    return text;
  } catch (err) {
    return null;
  }
}

/**
 * generateSeoInsights
 * Accepts: { title, metaDescription, keywords, wordText, competitors }
 * competitors - array of objects { url, title, snippet, domain, position } or just URLs.
 *
 * Returns parsed JSON object (or empty object on error).
 */
async function generateSeoInsights({ title, metaDescription, keywords = [], wordText = "", competitors = [] }) {
  try {
    // build competitor summary for prompt
    let compSummary = "";
    if (Array.isArray(competitors) && competitors.length) {
      compSummary = "\nCOMPETITORS:\n";
      competitors.forEach((c, i) => {
        if (typeof c === "string") {
          compSummary += `${i+1}. URL: ${c}\n`;
        } else {
          compSummary += `${i+1}. ${c.title || ""} ${c.domain ? `(${c.domain})` : ""}\n   URL: ${c.link || c.url || ""}\n   Snippet: ${c.snippet || ""}\n`;
        }
      });
    } else {
      compSummary = "\nCOMPETITORS: none provided.\n";
    }

    const prompt = `
You are an expert SEO consultant. Analyze the following webpage content and provide a structured SEO improvement report.
Return ONLY valid JSON (no extra commentary or code blocks).

DATA:
Title: ${safeText(title) || "null"}
Meta Description: ${safeText(metaDescription) || "null"}
Top Keywords: ${JSON.stringify(keywords || [])}
Content Snippet (first 1200 chars): ${safeText(wordText).slice(0,1200)}

${compSummary}

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
  "priorityFixes": [],
  "competitorInsights": { "averageLength": 0, "commonKeywords": [], "missingOpportunities": [], "topTakeaways": [] }
}
    `;

    const res = await client.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
      max_output_tokens: 900
    });

    let raw = res.output_text || "";

    // Defensive parse: try direct parse, then regex object extraction
    try {
      return JSON.parse(raw);
    } catch (err) {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(match[0]); } catch (err2) { /* fall through */ }
      }
      // fallback: return wrapper with raw text
      return { error: "ai_parse_failed", raw: raw.slice(0, 4000) };
    }
  } catch (error) {
    console.error("generateSeoInsights error:", error && error.message ? error.message : error);
    return {};
  }
}

module.exports = { callOpenAI, generateSeoInsights };
