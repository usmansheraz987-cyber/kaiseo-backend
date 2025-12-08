// routes/seo-analyzer.js
const express = require('express');
const router = express.Router();

const extractHtml = require('../utils/extractHtml');
const { analyzeTextFallback } = require('../utils/keywordExtractor');
const { analyzeSemantics } = require('../utils/semanticEngine');
const { fetchSERP } = require('../utils/serpScraper');
const technicalAudit = require('../utils/technicalAudit');
const scoreSeo = require('../utils/seoScore');
const readability = require('../utils/readability');
const aiClient = require('../utils/aiClient');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 60 * 5 }); // 5 minutes cache for repeated urls/content

// POST /api/seo-analyze
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const html = body.html;
    const text = body.text;
    const url = body.url;
    const maxSize = 200_000; // max characters allowed

    // quick dedupe key
    const rawKey = html ? `html:${String(html).slice(0, 100)}` : `text:${String(text || '').slice(0, 100)}`;
    const cached = cache.get(rawKey);
    if (cached) return res.json({ cached: true, ...cached });

    // Choose mode: HTML or text
    if (html && html.length > 0) {
      if (html.length > maxSize) return res.status(400).json({ error: 'HTML too large' });
      // extract HTML
      const extracted = extractHtml(html, { url });

      // Core metrics
      const words = extracted.wordText || '';
      const read = readability.computeFlesch(words);
      const simpleKeywords = analyzeTextFallback(words, { topK: 10 });

      // semantic analysis
      const semantic = analyzeSemantics(words, { topK: 12 });
      const keywords = simpleKeywords;

      // score
      const score = scoreSeo(extracted, { readability: read, keywords });

      // === COMPETITOR SERP ANALYSIS ===
      let serpCompetitors = [];
      try {
        const query = extracted.title || extracted.ogTitle || 'seo tools';
        serpCompetitors = await fetchSERP(query);
      } catch (e) {
        serpCompetitors = [];
      }

      // AI insights (competitor-aware)
      let aiInsights = {};
      try {
        aiInsights = await aiClient.generateSeoInsights({
          title: extracted.title || null,
          metaDescription: extracted.metaDescription || null,
          keywords,
          wordText: words,
          competitors: serpCompetitors
        });
      } catch (e) {
        aiInsights = {};
      }

      const tech = technicalAudit(extracted, html);

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
        technical: tech,
        competitors: serpCompetitors,
        ai: aiInsights,
        links: {
          internal: extracted.internalLinks.length,
          external: extracted.externalLinks.length,
          internalList: extracted.internalLinks.slice(0, 50),
          externalList: extracted.externalLinks.slice(0, 50),
        },
        wordText: words
      };

      cache.set(rawKey, output);
      return res.json(output);
    }

    // TEXT mode fallback
    // body.text expected
    const plain = text || '';
    if (!plain || plain.trim().length === 0) return res.status(400).json({ error: 'Provide html or text' });
    if (plain.length > maxSize) return res.status(400).json({ error: 'Text too large' });

    const read = readability.computeFlesch(plain);
    const simpleKeywords = analyzeTextFallback(plain, { topK: 10 });
    const semantic = analyzeSemantics(plain, { topK: 12 });
    const keywords = simpleKeywords;

    const score = scoreSeo({
      title: body.title || null,
      metaDescription: body.metaDescription || null,
      headings: [],
      images: [],
      links: { internal: [], external: [] },
      wordText: plain
    }, { readability: read, keywords });

    // If user supplied a competitors list in request body.use it.
    let serpCompetitors = Array.isArray(body.competitors) ? body.competitors : [];
    if (!serpCompetitors.length && (body.query || body.title)) {
      try {
        const query = body.query || body.title;
        serpCompetitors = await fetchSERP(query);
      } catch (e) {
        serpCompetitors = [];
      }
    }

    let aiInsights = {};
    try {
      aiInsights = await aiClient.generateSeoInsights({
        title: body.title || null,
        metaDescription: body.metaDescription || null,
        keywords,
        wordText: plain,
        competitors: serpCompetitors
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
      competitors: serpCompetitors,
      ai: aiInsights,
      wordText: plain,
      fixes: { logic: score.actions || [], ai: aiInsights }
    };

    cache.set(rawKey, out);
    return res.json(out);
  } catch (err) {
    console.error('seo-analyze error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'internal error' });
  }
});

module.exports = router;
