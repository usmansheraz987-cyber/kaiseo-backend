const express = require('express');
const router = express.Router();
const extractHtml = require('../utils/extractHtml');
const { analyzeTextFallback } = require('../utils/keywordExtractor');
const { analyzeSemantics } = require('../utils/semanticEngine');
const { fetchSERP } = require('../utils/serpScraper');
const technicalAudit = require('../utils/technicalAudit');
const scoreSeo = require('../utils/seoScore');
const readability = require('../utils/readability');
const aiClient = require('../utils/aiClient'); // your existing ai client
const NodeCache = require('node-cache');


const cache = new NodeCache({ stdTTL: 60 * 5 }); // 5 min cache for repeated URLs/content

// Optional rate limiting may already be global in index.js
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const html = body.html;
    const text = body.text;
    const url = body.url;
    const maxSize = 200_000; // max characters allowed

    const rawKey = html ? `html:${html.slice(0,100)}` : `text:${(text||'').slice(0,100)}`;
    const cached = cache.get(rawKey);
    if (cached) return res.json({ cached: true, ...cached });

    // choose mode
    if (html && html.length > 0) {
      if (html.length > maxSize) return res.status(400).json({ error: 'HTML too large' });

      const extracted = extractHtml(html, { url });
      // Core metrics
      const words = extracted.wordText;
      const read = readability.computeFlesch(words);
      // keep old simple keywords for density if you want
const simpleKeywords = analyzeTextFallback(words, { topK: 10 });

// semantic analysis (phrases, clusters)
const semantic = analyzeSemantics(words, { topK: 12 });
const keywords = simpleKeywords; // keep backward compatibility in output

      const score = scoreSeo(extracted, { readability: read, keywords });
// === COMPETITOR SERP ANALYSIS ===
let serpCompetitors = [];
try {
  const query = extracted.title || extracted.ogTitle || "seo tools";
  serpCompetitors = await fetchSERP(query);
} catch (e) {
  serpCompetitors = [];
}

      // ===== ADVANCED AI SEO INSIGHTS =====
let aiInsights = {};
try {
  aiInsights = await aiClient.generateSeoInsights({
    title: extracted.title,
    metaDescription: extracted.metaDescription,
    keywords,
    wordText: words,
    competitors: serpCompetitors
  });
} catch (e) {
  aiInsights = {};
}

      const output = {
        mode: 'html',
        url: extracted.canonical || url || null,
        score,
        metadata: {
          title: extracted.title || null,
          titleLength: extracted.title ? extracted.title.length : 0,
          metaDescription: extracted.metaDescription || null,
          metaLength: extracted.metaDescription ? extracted.metaDescription.length : 0,
          ogTitle: extracted.ogTitle || null,
        },
        headings: extracted.headings,
        readability: read,
        keywords,
        semantic: {
  semanticKeywords: semantic.semanticKeywords,
  keyphrases: semantic.keyphrases,
  clusters: semantic.clusters
},
competitors: serpCompetitors,


        links: {
          internal: extracted.internalLinks.length,
          external: extracted.externalLinks.length,
          internalList: extracted.internalLinks.slice(0,50),
          externalList: extracted.externalLinks.slice(0,50),
        },
        images: {
          total: extracted.images.length,
          missingAlt: extracted.images.filter(i => !i.alt).length,
          images: extracted.images.slice(0,50),
        },
        technical: {
          canonical: !!extracted.canonical,
          robots: extracted.robots || null,
          schema: !!extracted.schema,
          og: !!(extracted.ogTitle || extracted.ogDescription),
        },
        fixes: {
          logic: score.actions || [],
          ai: aiInsights
        }
      };

      cache.set(rawKey, output);
      return res.json(output);
    }

    // FALLBACK -> text mode
    const plain = text || '';
    if (!plain || plain.trim().length === 0) return res.status(400).json({ error: 'Provide html or text' });
    if (plain.length > maxSize) return res.status(400).json({ error: 'Text too large' });

    const read = readability.computeFlesch(plain);
    // keep old simple keywords for density if you want
const simpleKeywords = analyzeTextFallback(plain, { topK: 10 });

// semantic analysis (phrases, clusters)
const semantic = analyzeSemantics(plain, { topK: 12 });
const keywords = simpleKeywords; // keep backward compatibility in output

    // minimal structure for text mode
    const score = scoreSeo({
      // minimal shape expected by scoreSeo
      title: body.title || null,
      metaDescription: body.metaDescription || null,
      headings: [],
      images: [],
      links: { internal: [], external: [] },
      wordText: plain
    }, { readability: read, keywords });

let aiInsights = {};
try {
  aiInsights = await aiClient.generateSeoInsights({
    title: body.title || null,
    metaDescription: body.metaDescription || null,
    keywords,
    wordText: plain
  });
} catch (e) {
  aiInsights = {};
}

    const out = {
      mode: 'text',
      score,
      readability: read,
      keywords,
      semantic: {
  semanticKeywords: semantic.semanticKeywords,
  keyphrases: semantic.keyphrases,
  clusters: semantic.clusters
},

      fixes: { logic: score.actions || [], ai: aiInsights }
    };

    cache.set(rawKey, out);
    return res.json(out);

  } catch (err) {
    console.error('seo-analyze error:', err.message || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
