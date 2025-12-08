// utils/aiClient.js (partial - replace generateSeoInsights implementation)
async function generateSeoInsights({ title, metaDescription, keywords, wordText, competitors = [] }) {
  try {
    // Build a compact competitor summary to include in prompt
    const compSummary = (competitors || []).slice(0, 6).map((c, i) => {
      // competitor object expected: { position, title, link, snippet, domain }
      return `${i+1}. ${c.title || c.domain || c.link} — ${c.domain || ''} — ${c.link || ''} — snippet: ${c.snippet || ''}`;
    }).join('\n') || 'None';

    const prompt = `
You are an expert SEO consultant. Analyze the following webpage content and provide a structured SEO improvement report.
Include competitor-aware suggestions based on the COMPETITORS list.

DATA:
Title: ${title || "null"}
Meta Description: ${metaDescription || "null"}
Top Keywords: ${JSON.stringify(keywords || [])}
Content Snippet: ${wordText ? wordText.slice(0, 1400) : ""}

COMPETITORS:
${compSummary}

Output ONLY valid JSON matching the schema below.

JSON FORMAT:
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
    "topTakeaways": []
  },
  "toneAndReadabilityAdvice": "",
  "priorityFixes": []
}
    `;

    const res = await client.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
      max_output_tokens: 800
    });

    let raw = res.output_text || "";
    // defensive parsing
    try {
      return JSON.parse(raw);
    } catch (err) {
      const match = raw.match(/\{[\s\S]*\}$/);
      if (match) return JSON.parse(match[0]);
      return {};
    }
  } catch (error) {
    console.error("SEO Insight Error:", error);
    return {};
  }
}
