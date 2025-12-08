// routes/seo-analyzer.js
const express = require('express');
const router = express.Router();
const extractHtml = require('../utils/extractHtml');
const { analyzeTextFallback } = require('../utils/keywordExtractor');
const { analyzeSemantics } = require('../utils/semanticEngine');
const { fetchSERP } = require('../utils/serpScraper'); // new
const technicalAudit = require('../utils/technicalAudit');
const scoreSeo = require('../utils/seoScore');
const readability = require('../utils/readability');
const aiClient = require('../utils/aiClient'); // patched
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 60 * 5 }); // 5 minutes cache

router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const html = body.html;
    const text = body.text;
    const url = body.url;
    const maxSize = 200_000;
    const frontendCompetitor = body.competitor || body.competitors || null; // optional single url or array

    const rawKey = html ? `html:${(html||"").slice(0,100)}` : `text:${(text||"").slice(0,100)}`;
    const cached = cache.get(rawKey);
    if (cached) return res.json({ cached: true, ...cached });

    // choose mode
    if (html && html.length > 0) {
      if (html.length > maxSize) return res.status(400).json({ error: 'HTML too large' });

      const extracted = extractHtml(html, { url });
      const words = extracted.wordText || "";
      const read = readability.computeFlesch(words);

      // old keyword fallback
      const simpleKeywords = analyzeTextFallback(words, { topK: 10 });

      // semantic analysis
      const semantic = analyzeSemantics(words, { topK: 12 });
      const keywords = simpleKeywords; // keep backward compatibility

      // score
      const score = scoreSeo(extracted, { readability: read, keywords });

      // optional competitor logic:
      let serpCompetitors = [];
      try {
        if (frontendCompetitor) {
          // if frontend passed a single URL string, wrap it into a minimal competitor object
          if (typeof frontendCompetitor === "string") {
            serpCompetitors = [{ link: frontendCompetitor, url: frontendCompetitor }];
          } else if (Array.isArray(frontendCompetitor)) {
            serpCompetitors = frontendCompetitor.map(u => (typeof u === "string" ? { link: u, url: u } : u));
          } else if (frontendCompetitor.url || frontendCompetitor.link) {
            serpCompetitors = [frontendCompetitor];
          } else {
            serpCompetitors = []; // ignore unknown shapes
          }
        } else {
          // automatic SERP lookup using extracted title or ogTitle, fallback to "seo tools"
          const query = extracted.title || extracted.ogTitle || "seo tools";
          serpCompetitors = await fetchSERP(query);
        }
      } catch (e) {
        console.warn("SERP competitors fetch failed:", e && e.message ? e.message : e);
        serpCompetitors = [];
      }

      // AI insights (give it competitors array)
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

      // technical audit (existing helper)
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
          ogTitle: extracted.ogTitle || null
        },
        headings: extracted.headings || [],
        readability: read,
        keywords,
        semantic: {
          semanticKeywords: semantic.semanticKeywords || [],
          keyphrases: semantic.keyphrases || [],
          clusters: semantic.clusters || []
        },
        technical: tech || {},
        competitors: serpCompetitors || [],
        ai: aiInsights || {},
        links: {
          internal: Array.isArray(extracted.internalLinks) ? extracted.internalLinks.length : 0,
          external: Array.isArray(extracted.externalLinks) ? extracted.externalLinks.length : 0,
          internalList: (extracted.internalLinks || []).slice(0,50),
          externalList: (extracted.externalLinks || []).slice(0,50)
        },
        fixes: { logic: score.actions || [], ai: aiInsights }
      };

      cache.set(rawKey, output);
      return res.json(output);
    }

    // TEXT mode fallback
    const plain = text || "";
    if (!plain || plain.trim().length === 0) return res.status(400).json({ error: 'Provide html or text' });
    if (plain.length > maxSize) return res.status(400).json({ error: 'Text too large' });

    const read = readability.computeFlesch(plain);
    const simpleKeywords = analyzeTextFallback(plain, { topK: 10 });
    const semantic = analyzeSemantics(plain, { topK: 12 });
    const keywords = simpleKeywords;

    // optional competitor logic for text mode (same as above)
    let serpCompetitors = [];
    try {
      if (frontendCompetitor) {
        if (typeof frontendCompetitor === "string") serpCompetitors = [{ link: frontendCompetitor, url: frontendCompetitor }];
        else if (Array.isArray(frontendCompetitor)) serpCompetitors = frontendCompetitor.map(u => (typeof u === "string" ? { link: u, url: u } : u));
        else serpCompetitors = [];
      } else {
        // we can base the query on first sentence or keywords
        const query = (plain.split("\n")[0] || "").slice(0, 80) || "seo tools";
        serpCompetitors = await fetchSERP(query);
      }
    } catch (e) {
      serpCompetitors = [];
    }

    const score = scoreSeo({
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
        semanticKeywords: semantic.semanticKeywords || [],
        keyphrases: semantic.keyphrases || [],
        clusters: semantic.clusters || []
      },
      competitors: serpCompetitors || [],
      ai: aiInsights || {},
      fixes: { logic: score.actions || [], ai: aiInsights }
    };

    cache.set(rawKey, out);
    return res.json(out);

  } catch (err) {
    console.error("analysis error:", err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'internal_error', details: (err && err.message) || String(err) });
  }
});

module.exports = router;
