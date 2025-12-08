// utils/serpScraper.js
const fetch = require('node-fetch');

const SERPAPI_KEY = process.env.SERPAPI_KEY || '';

/**
 * fetchSERP(query) -> returns array of { position, title, link, snippet, domain }
 * - uses SerpAPI (Google) format. If SERPAPI_KEY not set, returns [].
 */
async function fetchSERP(query = '') {
  if (!query || !SERPAPI_KEY) return [];

  try {
    const params = new URLSearchParams({
      q: query,
      engine: 'google',
      api_key: SERPAPI_KEY,
      num: '10',
      // location: 'United States' // optional
    });

    const url = `https://serpapi.com/search.json?${params.toString()}`;
    const r = await fetch(url, { timeout: 20000 });
    if (!r.ok) return [];

    const data = await r.json();

    // SerpAPI result parsing - adapt if your provider has different shape
    const serp = (data.organic_results || data.organic || []).slice(0, 10).map((item, idx) => ({
      position: item.position || idx + 1,
      title: item.title || item.rich_snippet?.top?.title || '',
      link: item.link || item.url || item.rich_snippet?.top?.link || '',
      snippet: item.snippet || item.rich_snippet?.top?.snippet || '',
      domain: (item.link || '').replace(/^https?:\/\//, '').split('/')[0] || ''
    }));

    return serp;
  } catch (err) {
    console.error('fetchSERP error', err && err.message ? err.message : err);
    return [];
  }
}

module.exports = { fetchSERP };
