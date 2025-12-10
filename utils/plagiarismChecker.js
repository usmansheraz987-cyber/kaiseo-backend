const crypto = require("crypto");
const fetchSERP = require("./serpScraper");
const { askAI } = require("./aiClient");

module.exports = {
  async check(text) {
    const cleaned = text.trim();

    if (!cleaned || cleaned.length < 30) {
      return {
        plagiarismScore: 0,
        sources: [],
        aiVerdict: "Text too short for plagiarism analysis"
      };
    }

    const fingerprint = hash(cleaned);

    const sentences = cleaned
      .split(/[.!?]/)
      .map(s => s.trim())
      .filter(s => s.length > 20)
      .slice(0, 5);

    let serpSources = [];

    for (const s of sentences) {
      try {
        const serp = await fetchSERP(s);
        if (serp && serp.snippets) {
          serp.snippets.forEach(sn => {
            serpSources.push({
              query: s,
              snippet: sn.text,
              url: sn.url,
              match: similarity(cleaned, sn.text)
            });
          });
        }
      } catch (e) {}
    }

    serpSources = serpSources
      .filter(s => s.match > 0.35)
      .sort((a, b) => b.match - a.match)
      .slice(0, 5);

    const bestMatch = serpSources[0]?.match || 0;
    const plagiarismScore = Math.round(bestMatch * 100);

    const ai = await askAI(
      `Does the following text appear copied or original? 
       Respond only with a JSON: 
       { "verdict": "original | lightly_modified | copied", "confidence": 0-1 }

       TEXT: """${cleaned}"""
      `
    );

    let aiVerdict = {};
    try {
      aiVerdict = JSON.parse(ai);
    } catch {
      aiVerdict = { verdict: "unknown", confidence: 0.5 };
    }

    return {
      plagiarismScore,
      fingerprint,
      sources: serpSources,
      aiVerdict
    };
  }
};

function hash(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function similarity(a, b) {
  const aTokens = a.toLowerCase().split(/\W+/);
  const bTokens = b.toLowerCase().split(/\W+/);
  const setA = new Set(aTokens);
  const setB = new Set(bTokens);

  const intersection = [...setA].filter(t => setB.has(t));
  const union = new Set([...setA, ...setB]);

  return intersection.length / union.size;
}
