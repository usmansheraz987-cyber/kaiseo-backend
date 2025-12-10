// utils/internalLinker.js

const fetch = require("node-fetch");
const cheerio = require("cheerio");
const { analyzeTextFallback } = require("./keywordExtractor");

// Small helper to normalize domain (strip protocol + www)
function normalizeDomain(domain) {
  if (!domain) return "";
  return domain
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .toLowerCase();
}

// Make sure URL has protocol
function ensureAbsolute(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return "https://" + url.replace(/^\/+/, "");
}

// Fetch HTML safely
async function fetchHtml(url) {
  const absolute = ensureAbsolute(url);
  if (!absolute) return "";
  try {
    const res = await fetch(absolute, {
      timeout: 15000,
      headers: {
        "User-Agent": "KaiSEO-InternalLinker/1.0"
      }
    });
    if (!res.ok) return "";
    return await res.text();
  } catch (e) {
    console.error("fetchHtml error:", e.message || e);
    return "";
  }
}

// Extract main text + headings from a page
function extractContent(html) {
  const $ = cheerio.load(html);

  const title = $("title").first().text().trim() || null;

  const headings = [];
  ["h1", "h2", "h3"].forEach(tag => {
    $(tag).each((_, el) => {
      const txt = $(el).text().trim();
      if (txt) headings.push({ tag: tag.toUpperCase(), text: txt });
    });
  });

  const blocks = [];
  $("p, li").each((_, el) => {
    const t = $(el).text().trim();
    if (t && t.length > 30) blocks.push(t);
  });

  const text = blocks.join(" ");

  return { title, headings, text };
}

// Extract internal links from HTML restricted by domain
function extractInternalLinks(html, rootDomain) {
  const $ = cheerio.load(html);
  const links = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    const anchor = $(el).text().trim();

    if (!href) return;

    // skip mailto etc.
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return;

    let absolute;
    if (/^https?:\/\//i.test(href)) {
      absolute = href;
    } else if (href.startsWith("/")) {
      absolute = "https://" + rootDomain + href;
    } else {
      // relative like "page.html"
      absolute = "https://" + rootDomain + "/" + href.replace(/^\/+/, "");
    }

    const linkDomain = normalizeDomain(absolute);
    if (!linkDomain || linkDomain !== rootDomain) return; // external, skip

    links.push({
      url: absolute,
      anchor: anchor || null
    });
  });

  // de-duplicate by URL
  const seen = new Set();
  const unique = [];
  for (const l of links) {
    if (seen.has(l.url)) continue;
    seen.add(l.url);
    unique.push(l);
  }

  return unique;
}

// Build a simple anchor from URL slug
function anchorFromUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname.split("/").filter(Boolean).pop() || "";
    if (!path) return null;
    return path
      .replace(/[-_]+/g, " ")
      .replace(/\.[a-z0-9]+$/i, "")
      .trim();
  } catch {
    return null;
  }
}

// Score a candidate internal link based on keyword overlap
function scoreLink(candidate, keywords) {
  const anchor = candidate.anchor || anchorFromUrl(candidate.url) || "";
  const anchorWords = anchor.toLowerCase().split(/\s+/).filter(Boolean);
  if (!anchorWords.length) return 0;

  const kwStrings = keywords.map(k =>
    typeof k === "string" ? k.toLowerCase() : (k.keyword || "").toLowerCase()
  );

  let score = 0;
  for (const w of anchorWords) {
    if (kwStrings.some(kw => kw.includes(w) || w.includes(kw))) {
      score += 10;
    }
  }

  if (/blog|guide|tutorial|tool|seo|learn/i.test(anchor)) score += 5;
  return score;
}

// Main function you will call from the route
async function analyzeInternalLinks({ url, domain }) {
  const rootDomain = normalizeDomain(domain || url);
  if (!rootDomain) {
    throw new Error("Invalid domain");
  }

  // 1. Fetch target page
  const targetHtml = await fetchHtml(url);
  if (!targetHtml) {
    throw new Error("Failed to fetch target URL");
  }

  const targetContent = extractContent(targetHtml);

  // 2. Fetch homepage for candidate internal links
  const homeHtml = await fetchHtml("https://" + rootDomain);
  const candidates = homeHtml
    ? extractInternalLinks(homeHtml, rootDomain)
    : [];

  // 3. Keywords from target page text
  const keywords = analyzeTextFallback(targetContent.text || "", { topK: 15 });

  // 4. Score candidates
  const scored = candidates.map(c => ({
    ...c,
    score: scoreLink(c, keywords)
  }));

  scored.sort((a, b) => b.score - a.score);

  const suggestions = scored
    .filter(s => s.score > 0)
    .slice(0, 15)
    .map(s => ({
      url: s.url,
      anchor: s.anchor || anchorFromUrl(s.url),
      score: s.score
    }));

  return {
    ok: true,
    url,
    domain: rootDomain,
    topic: targetContent.title || (targetContent.headings[0]?.text || null),
    keywordSamples: keywords,
    suggestions,
    stats: {
      totalCandidates: candidates.length,
      totalSuggestions: suggestions.length
    }
  };
}

module.exports = {
  analyzeInternalLinks
};
