const cheerio = require('cheerio');
const { stripHtml } = require('./keywordExtractor');

function extractHtml(html, { url } = {}) {
  const $ = cheerio.load(html, { decodeEntities: true });

  // remove scripts & styles
  $('script, style, noscript, iframe').remove();

  const title = $('head > title').text().trim() || null;
  const metaDescription = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || null;
  const metaKeywords = $('meta[name="keywords"]').attr('content') || null;
  const canonical = $('link[rel="canonical"]').attr('href') || null;
  const robots = $('meta[name="robots"]').attr('content') || null;
  const ogTitle = $('meta[property="og:title"]').attr('content') || null;
  const ogDescription = $('meta[property="og:description"]').attr('content') || null;

  // headings
  const headings = [];
  for (let i = 1; i <= 6; i++) {
    $(`h${i}`).each((idx, el) => {
      headings.push({ tag: `h${i}`, text: $(el).text().trim() });
    });
  }

  // links
  const links = [];
  $('a[href]').each((i, el) => {
    const href = $(el).attr('href').trim();
    const text = $(el).text().trim();
    links.push({ href, text });
  });

  // determine internal vs external (best-effort)
  const internalLinks = [];
  const externalLinks = [];
  const baseHost = url ? safeHost(url) : null;
  links.forEach(l => {
    if (!l.href) return;
    const h = l.href;
    if (h.startsWith('#') || h.startsWith('/') || (baseHost && h.includes(baseHost))) internalLinks.push(l);
    else if (h.startsWith('http')) externalLinks.push(l);
    else internalLinks.push(l);
  });

  // images
  const images = [];
  $('img').each((i, el) => {
    images.push({
      src: $(el).attr('src') || null,
      alt: $(el).attr('alt') || null,
      title: $(el).attr('title') || null
    });
  });

  // schema presence check
  const schema = $('script[type="application/ld+json"]').length > 0;

  // pull visible text
  const bodyText = $('body').text() || '';
  const cleaned = normalizeWhitespace(bodyText);
  const wordText = stripHtml(cleaned);

  return {
    title, metaDescription, metaKeywords, canonical, robots, ogTitle, ogDescription,
    headings, internalLinks, externalLinks, images, schema, wordText
  };
}

function normalizeWhitespace(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

function safeHost(u) {
  try {
    const urlObj = new URL(u);
    return urlObj.hostname;
  } catch (e) {
    return null;
  }
}

module.exports = extractHtml;
