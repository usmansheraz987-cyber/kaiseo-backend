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

const cache = new NodeCache({ stdTTL: 60 * 5 });
const MAX_SIZE = 200_000;

// POST /api/seo-analyze
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const html = body.html;
    const text = body.text;
    const url = body.url || null;

    const cacheKey = html
      ? `html:${String(html).slice(0, 120)}`
      : `text:${String(text || '').slice(0, 120)}`;

    const cached = cache.get(cacheKey);
    if (cached) return res.json({ cached: true, ...cached });

    /* =========================
       HTML MODE
    ========================= */
    if (html && html.length > 0) {
      if (html.length > MAX_SIZE) {
        return res.status(400).json({ error: 'HTML too large' });
      }

      const extracted = extractHtml(html, { url });
      const wordText = extracted.wordText || '';

      const read = readability.analyze(wordText);
      const keywords = analyzeTextFallback(wordText, { topK: 10 });

      let semantic = { semanticKeywords: [], keyphrases: [], clusters: [] };
      try {
        semantic = analyzeSemantics(wordText, { topK: 12 });
      } catch {}

      extracted.readability = read;
      extracted.keywords = keywords;
      extracted.semantic = semantic;
      extracted.links = {
        internal: extracted.internalLinks || [],
        external: extracted.externalLinks || []
      };

      let technical = { passed: false, issues: [] };
      try {
        technical = technicalAudit(extracted, html);
      } catch {
        technical.issues.push('Technical audit failed');
      }
      extracted.technical = technical;

      const score = scoreSeo(extracted);

      let serpCompetitors = [];
      try {
        serpCompetitors = await fetchSERP(extracted.title || 'seo');
      } catch {}

      let aiInsights = {};
      try {
        aiInsights = await aiClient.generateSeoInsights({
          title: extracted.title || null,
          metaDescription: extracted.metaDescription || null,
          keywords,
          wordText,
          competitors: serpCompetitors
        });
      } catch {}

      const output = {
        mode: 'html',
        url: extracted.canonical || url,
        score,
        metadata: {
          title: extracted.title || null,
          metaDescription: extracted.metaDescription || null
        },
        readability: read,
        keywords,
        semantic,
        technical,
        competitors: serpCompetitors,
        ai: aiInsights,
        wordText
      };

      cache.set(cacheKey, output);
      return res.json(output);
    }

    /* =========================
       TEXT MODE
    ========================= */
    const plain = text || '';
    if (!plain.trim()) {
      return res.status(400).json({ error: 'Provide html or text' });
    }
    if (plain.length > MAX_SIZE) {
      return res.status(400).json({ error: 'Text too large' });
    }

    const read = readability.analyze(plain);
    const keywords = analyzeTextFallback(plain, { topK: 10 });

    let semantic = { semanticKeywords: [], keyphrases: [], clusters: [] };
    try {
      semantic = analyzeSemantics(plain, { topK: 12 });
    } catch {}

    const score = scoreSeo({
      title: body.title || null,
      metaDescription: body.metaDescription || null,
      headings: [],
      images: [],
      links: { internal: [], external: [] },
      wordText: plain,
      readability: read,
      keywords,
      semantic
    });

    let serpCompetitors = [];
    try {
      serpCompetitors = await fetchSERP(body.query || body.title || 'seo');
    } catch {}

    let aiInsights = {};
    try {
      aiInsights = await aiClient.generateSeoInsights({
        title: body.title || null,
        metaDescription: body.metaDescription || null,
        keywords,
        wordText: plain,
        competitors: serpCompetitors
      });
    } catch {}

    const output = {
      mode: 'text',
      score,
      readability: read,
      keywords,
      semantic,
      competitors: serpCompetitors,
      ai: aiInsights,
      wordText: plain
    };

    cache.set(cacheKey, output);
    return res.json(output);

  } catch (err) {
    console.error('seo-analyze error:', err);
    return res.status(500).json({
      error: 'internal error',
      debug: err?.message || String(err)
    });
  }
});

module.exports = router;
