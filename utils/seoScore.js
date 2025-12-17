// utils/seoScore.js
// Returns { score: number (0-100), weightBreakdown: {...}, actions: [...], details: {...} }

function clamp(v, a = 0, b = 100) { return Math.max(a, Math.min(b, v)); }

function pct(val) { return clamp(Math.round(val * 100)); } // 0..100

function scorePresence(bool, weight) {
  return bool ? weight : 0;
}

function scoreRange(value, idealMin, idealMax, weight) {
  if (value == null) return 0;
  if (value < idealMin) return (value / idealMin) * weight;
  if (value > idealMax) { // penalize lightly for too long
    const over = Math.max(0, value - idealMax);
    const penalty = Math.min(weight * 0.5, (over / idealMax) * weight * 0.25);
    return Math.max(0, weight - penalty);
  }
  return weight;
}

function normalizeWeightedSum(buckets) {
  // buckets = [{score, weight}, ...] score in 0..weight
  const totalWeight = buckets.reduce((s, b) => s + b.weight, 0) || 1;
  const achieved = buckets.reduce((s, b) => s + Math.max(0, Math.min(b.score, b.weight)), 0);
  return (achieved / totalWeight) * 100;
}

module.exports = function scoreSeo(content = {}, options = {}) {
    // === SAFETY NORMALIZATION (ADDED) ===
  content = content || {};
  content.headings = Array.isArray(content.headings) ? content.headings : [];
  content.images = Array.isArray(content.images) ? content.images : [];
  content.links = content.links || { internal: [], external: [] };
  content.semantic = content.semantic || {};
  content.readability = content.readability || {};
  content.technical = content.technical || {};
  
  // content: minimal expected shape:
  // { title, metaDescription, headings: [], images: [{alt}], links: {internal:[], external:[]}, wordText, readability: {flesch,...}, keywords:[], semantic:{semanticKeywords, keyphrases, clusters}, technical: {...}, performance: {...}, competitors: [...] }
  const weights = {
    technical: 0.35,
    content: 0.35,
    semantic: 0.15,
    ux: 0.10,
    competitors: 0.05
  };

  // TECHNICAL (0..100)
  const techParts = [];
  const titlePresent = Boolean(content.title && content.title.trim().length);
  techParts.push({ score: scorePresence(titlePresent, 10), weight: 10 }); // title presence

  const metaPresent = Boolean(content.metaDescription && content.metaDescription.trim().length);
  techParts.push({ score: scorePresence(metaPresent, 10), weight: 10 });

  // H1 presence
  const h1s = (content.headings || []).filter(h => h.level === 1 || /^h1$/i.test(h.tag || ""));
  techParts.push({ score: scorePresence(h1s.length >= 1, 10), weight: 10 });

  // Duplicate H1 / multiple H1 penalty (score lower if duplicates)
  const dupH1Penalty = Math.max(0, 2 - h1s.length); // if 0 or 1 good; >1 reduce
  techParts.push({ score: Math.max(0, h1s.length === 1 ? 10 : Math.max(0, 10 - (h1s.length - 1) * 4)), weight: 10 });

  // images alt
  const images = content.images || [];
  const missingAlt = images.filter(img => !(img.alt && img.alt.trim().length)).length;
  const imgScore = images.length ? Math.round(((images.length - missingAlt) / images.length) * 10) : 10;
  techParts.push({ score: imgScore, weight: 10 });

  // Links - internal/external counts (presence)
  const links = content.links || { internal: [], external: [] };
  techParts.push({ score: Math.min(10, (links.internal.length + links.external.length) >= 1 ? 10 : 0), weight: 10 });

  // Basic robots/canonical suggestion (we can't check presence reliably, but use extracted.technical)
  const tech = content.technical || {};
  techParts.push({ score: scorePresence(!tech.blockedByRobots, 10), weight: 10 });
  techParts.push({ score: scorePresence(Boolean(tech.canonical), 10), weight: 10 });

  const technicalScore = normalizeWeightedSum(techParts);

  // CONTENT (0..100)
  const contentParts = [];
  const words = content.wordText ? content.wordText.split(/\s+/).filter(Boolean).length : 0;
  // ideal: 800..2000 for comprehensive content (adjust)
  contentParts.push({ score: scoreRange(words, 600, 2000, 25), weight: 25 });

  // Readability: prefer Flesch between 50-70 (example)
  const flesch = content.readability && content.readability.flesch;
  const fleschScore = flesch == null ? 10 : (flesch < 30 ? 5 : (flesch <= 80 ? (Math.min(80, flesch) / 80) * 25 : 25));
  contentParts.push({ score: fleschScore, weight: 25 });

  // Keyword usage (density and presence) - basic
  const keywords = (content.keywords || []).slice(0, 10);
  const keywordScore = keywords.length ? Math.min(20, keywords.reduce((s,k)=> s + (k.count? Math.min(4,k.count):0),0)) : 0;
  contentParts.push({ score: keywordScore, weight: 20 });

  // Content depth / uniqueness proxy: semantic clusters count
  const sem = content.semantic || {};
  const clusterCount = (sem.clusters || []).length;
  const clusterScore = Math.min(30, clusterCount * 5); // up to 30
  contentParts.push({ score: clusterScore, weight: 30 });

  const contentScore = normalizeWeightedSum(contentParts);

  // SEMANTIC (0..100)
  // measure coverage of semanticKeywords and keyphrases
  const semanticParts = [];
  const semKeywords = (sem.semanticKeywords || []).length;
  semanticParts.push({ score: Math.min(50, semKeywords * 5), weight: 50 });
  const keyphrases = (sem.keyphrases || []).length;
  semanticParts.push({ score: Math.min(50, keyphrases * 5), weight: 50 });
  const semanticScore = normalizeWeightedSum(semanticParts);

  // UX / PERFORMANCE (0..100) - optional performance metrics
  const uxParts = [];
  const perf = content.performance || {}; // {lcp, cls, fid, speedIndex}
  if (typeof perf.lcp === "number") {
    // best under 2.5s
    const s = perf.lcp <= 2.5 ? 25 : Math.max(0, 25 - ((perf.lcp - 2.5) * 6));
    uxParts.push({ score: s, weight: 25 });
  } else {
    uxParts.push({ score: 15, weight: 25 }); // unknown baseline
  }

  // mobile friendly hint (if content.technical.mobileFriendly true)
  uxParts.push({ score: scorePresence(content.technical && content.technical.mobileFriendly, 25), weight: 25 });

  // Core Web Vitals aggregate if available
  uxParts.push({ score: scorePresence(typeof perf.lcp === "number" && perf.lcp <= 2.5 && perf.cls <= 0.1, 50), weight: 50 });

  const uxScore = normalizeWeightedSum(uxParts);

  // COMPETITORS (0..100) - weak signal if competitors data present
  let competitorScore = 100;
  const comp = content.competitors || content.competitors || [];
  if (!comp || comp.length === 0) {
    competitorScore = 50; // neutral
  } else {
    // example: compare average length
    const avgLen = comp.reduce((s,c)=> s + (c.wordCount || 0), 0) / Math.max(1, comp.length);
    let ratio = words / Math.max(1, avgLen);
    // if you're significantly shorter than average, score lower
    if (ratio >= 1) competitorScore = 100;
    else competitorScore = Math.round(Math.max(20, ratio * 100));
  }

  // Combine pillars with weights
  const pillarScores = [
    { score: technicalScore, weight: weights.technical },
    { score: contentScore, weight: weights.content },
    { score: semanticScore, weight: weights.semantic },
    { score: uxScore, weight: weights.ux },
    { score: competitorScore, weight: weights.competitors }
  ];

  // weighted average to 0..100
  const totalWeight = pillarScores.reduce((s, p) => s + p.weight, 0);
  const raw = pillarScores.reduce((s, p) => s + (p.score * p.weight), 0) / Math.max(0.0001, totalWeight);

  const totalScore = Math.round(clamp(raw, 0, 100));

  // FAST actionable fixes (based on low subparts)
  const actions = [];

  if (!titlePresent) actions.push("Add a descriptive, unique title tag (<title>).");
  if (!metaPresent) actions.push("Add a compelling meta description (120–160 characters).");
  if (h1s.length === 0) actions.push("Add a single H1 that matches page intent.");
  if (images.length && missingAlt > 0) actions.push(`${missingAlt} images missing alt attributes.`);
  if (words < 300) actions.push("Increase content length to cover topic comprehensively (>=600 words).");
  if (contentScore < 40) actions.push("Improve content depth and readability; add examples and subheadings.");
  if (semanticScore < 30) actions.push("Add semantic/LSI keywords and related phrases to improve coverage.");
  if (uxScore < 40) actions.push("Improve page load performance and mobile responsiveness.");
  if ((comp || []).length > 0 && competitorScore < 70) actions.push("Benchmark content against top competitors; close gaps in depth and keywords.");

  // Provide details object for UI
  const details = {
    technical: {
      score: Math.round(technicalScore),
      titlePresent,
      metaPresent,
      h1Count: h1s.length,
      missingImageAlts: missingAlt,
      internalLinks: links.internal ? links.internal.length : 0,
      externalLinks: links.external ? links.external.length : 0,
      canonical: Boolean(tech.canonical),
      blockedByRobots: !!tech.blockedByRobots
    },
    content: {
      score: Math.round(contentScore),
      wordCount: words,
      flesch,
      topKeywords: (keywords || []).slice(0, 10),
      clusterCount
    },
    semantic: {
      score: Math.round(semanticScore),
      semanticKeywordsCount: semKeywords,
      keyphrasesCount: keyphrases
    },
    ux: {
      score: Math.round(uxScore),
      performance: perf
    },
    competitors: {
      score: Math.round(competitorScore),
      competitors: comp
    }
  };

  return {
    score: totalScore,
    weightBreakdown: {
      technical: Math.round(technicalScore),
      content: Math.round(contentScore),
      semantic: Math.round(semanticScore),
      ux: Math.round(uxScore),
      competitors: Math.round(competitorScore)
    },
    actions,
    details
  };
};
