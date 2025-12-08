// routes/seo-analyzer.js (replace the route handler section)
const express = require('express');
const router = express.Router();
const extractHtml = require('../utils/extractHtml'); // must return { wordText, headings, meta... }
const { analyzeTextFallback } = require('../utils/keywordExtractor');
const { analyzeSemantics } = require('../utils/semanticEngine');
const { fetchSERP } = require('../utils/serpScraper');
const technicalAudit = require('../utils/technicalAudit');
const scoreSeo = require('../utils/seoScore');
const readability = require('../utils/readability');
const aiClient = require('../utils/aiClient');
const NodeCache = require('node-cache');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const cache = new NodeCache({ stdTTL: 60 * 5 }); // 5 min

// helper to fetch and extract remote page
async function fetchAndExtractPage(url) {
  try {
    const res = await fetch(url, { timeout: 20000, headers: { 'User-Agent': process.env.USER_AGENT || 'Mozilla/5.0' } });
    if (!res.ok) return null;
    const html = await res.text();
    // reuse extractHtml to get standardized fields (wordText, headings, meta, links, etc.)
    return extractHtml(html, { url });
  } catch (err) {
    console.warn('fetchAndExtractPage error', err && err.message ? err.message : err);
    return null;
  }
}

router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const html = body.html || null;
    const text = body.text || null;
    const url = body.url || null;
    const competitorUrls = body.competitors || []; // front-end can send array of competitor page URLs

    const rawKey = html ? `html:${(html || '').slice(0,100)}` : `text:${(text||'').slice(0,100)}`;
    const cached = cache.get(rawKey);
    if (cached) return res.json({ cached: true, ...cached });

    const maxSize = 200_000;
    if (html && html.length > maxSize) return res.status(400).json({ error: 'HTML too large' });

    // choose mode
    let extracted;
    if (html && html.length > 0) {
      extracted = extractHtml(html, { url });
    } else if (text && text.length > 0) {
      // create a small synthetic extraction for text mode
      extracted = {
        wordText: text,
        title: null,
        metaDescription: null,
        headings: [],
        internalLinks: [],
        externalLinks: []
      };
    } else {
      return res.status(400).json({ error: 'Provide html or text' });
    }

    // core metrics
    const words = extracted.wordText || '';
    const read = readability.computeFlesch(words);
    const simpleKeywords = analyzeTextFallback(words, { topK: 10 });
    const semantic = analyzeSemantics(words, { topK: 12 });
    const keywords = simpleKeywords; // keep old shape
    const score = scoreSeo(extracted, { readability: read, keywords });

    // SERP competitors (if no explicit competitor list, try SERP)
    let serpCompetitors = [];
    try {
      if (Array.isArray(competitorUrls) && competitorUrls.length > 0) {
        // if frontend sent URLs, prefer those (map to simple objects)
        serpCompetitors = competitorUrls.map((u, i) => ({ position: i+1, link: u, title: '', snippet: '', domain: (u||'').replace(/^https?:\/\//,'').split('/')[0] }));
      } else {
        const query = extracted.title || extracted.ogTitle || 'seo tools';
        serpCompetitors = await fetchSERP(query);
      }
    } catch (e) {
      serpCompetitors = [];
    }

    // For each competitor result, attempt to fetch the page and extract same metrics
    const competitorDetails = [];
    for (const c of serpCompetitors.slice(0, 6)) {
      if (!c.link) continue;
      const page = await fetchAndExtractPage(c.link);
      if (!page) {
        competitorDetails.push({ ...c, extracted: null });
        continue;
      }
      // compute semantic/readability/score for competitor
      const compWords = page.wordText || '';
      const compRead = readability.computeFlesch(compWords);
      const compSimpleKeywords = analyzeTextFallback(compWords, { topK: 10 });
      const compSemantic = analyzeSemantics(compWords, { topK: 12 });
      const compScore = scoreSeo(page, { readability: compRead, keywords: compSimpleKeywords });

      competitorDetails.push({
        ...c,
        extracted: page,
        read: compRead,
        keywords: compSimpleKeywords,
        semantic: compSemantic,
        score: compScore
      });
    }

    // build competitorInsights summary
    const competitorInsights = {
      averageLength: 0,
      commonKeywords: [],
      missingOpportunities: [],
      topTakeaways: []
    };

    if (competitorDetails.length) {
      const lengths = competitorDetails.map(cd => (cd.extracted && cd.extracted.wordText) ? cd.extracted.wordText.split(/\s+/).length : 0);
      competitorInsights.averageLength = Math.round(lengths.reduce((a,b)=>a+b, 0) / (lengths.length || 1));
      // aggregate top keywords across competitors
      const keywordCount = {};
      competitorDetails.forEach(cd => {
        (cd.keywords || []).forEach(k => {
          const kstr = k.keyword || k;
          keywordCount[kstr] = (keywordCount[kstr] || 0) + 1;
        });
      });
      competitorInsights.commonKeywords = Object.entries(keywordCount)
        .sort((a,b)=>b[1]-a[1])
        .slice(0,10)
        .map(([kw,count])=>({ keyword: kw, count }));
      // missingOpportunities (very simple: keywords present in competitors but not in your page)
      const yourKeywords = new Set((keywords || []).map(k => k.keyword || k));
      const competitorKwSet = Object.keys(keywordCount);
      competitorInsights.missingOpportunities = competitorKwSet.filter(k => !yourKeywords.has(k)).slice(0,10);
      // topTakeaways: quick heuristics
      competitorInsights.topTakeaways = [
        `Top competitor avg length: ${competitorInsights.averageLength} words.`,
        `Common competitor keywords: ${competitorInsights.commonKeywords.slice(0,5).map(k=>k.keyword).join(', ')}`,
        `You are missing ${competitorInsights.missingOpportunities.length} competitor keywords in your top lists.`
      ];
    }

    // AI insights - pass competitor summary to LLM
    let aiInsights = {};
    try {
      aiInsights = await aiClient.generateSeoInsights({
        title: extracted.title || null,
        metaDescription: extracted.metaDescription || null,
        keywords,
        wordText: words,
        // pass top-level serpCompetitors array (link/title/snippet)
        competitors: serpCompetitors
      });
      // if LLM returned competitorInsights, prefer it merged
      if (aiInsights && aiInsights.competitorInsights) {
        competitorInsights.ai = aiInsights.competitorInsights;
      }
    } catch (e) {
      aiInsights = {};
    }

    // final output
    const output = {
      mode: html ? 'html' : 'text',
      url: extracted.canonical || url || null,
      score,
      metadata: {
        title: extracted.title || null,
        titleLength: extracted.title ? extracted.title.length : 0,
        metaDescription: extracted.metaDescription || null,
        metaLength: extracted.metaDescription ? extracted.metaDescription.length : 0,
        ogTitle: extracted.ogTitle || null,
      },
      headings: extracted.headings || [],
      readability: read,
      keywords,
      semantic: {
        semanticKeywords: semantic.semanticKeywords || [],
        keyphrases: semantic.keyphrases || [],
        clusters: semantic.clusters || []
      },
      technical: technicalAudit ? technicalAudit(extracted, html) : {},
      competitors: competitorDetails,         // detailed competitor objects (with extracted & scores)
      competitorInsights,                    // aggregated insights
      ai: aiInsights,
      links: {
        internal: (extracted.internalLinks || []).length,
        external: (extracted.externalLinks || []).length,
        internalList: (extracted.internalLinks || []).slice(0,50),
        externalList: (extracted.externalLinks || []).slice(0,50),
      },
      fixes: { logic: score.actions || [], ai: aiInsights || {} }
    };

    cache.set(rawKey, output);
    return res.json(output);

  } catch (err) {
    console.error('seo-analyze error', err);
    return res.status(500).json({ error: 'internal error' });
  }
});

module.exports = router;
