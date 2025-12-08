// utils/serpScraper.js
const axios = require('axios');
const { URL } = require('url');

const SERPAPI_KEY = process.env.SERPAPI_KEY || '';

async function fetchSERP(query, opts = {}) {
  // returns array of competitors: { title, link, snippet, domain }
  if (!query) return [];
  // Basic guard
  const safeQ = String(query).slice(0, 200);

  // If no SERPAPI_KEY, return [] (silent fallback)
  if (!SERPAPI_KEY) {
    return [];
  }

  try {
    // SerpAPI endpoint: search.json
    const params = {
      q: safeQ,
      engine: 'google',
      google_domain: 'google.com',
      hl: 'en',
      num: 10,
      api_key: SERPAPI_KEY
    };

    const resp = await axios.get('https://serpapi.com/search.json', { params, timeout: 10000 });
    const data = resp.data || {};

    const organic = data.organic_results || [];
    const out = organic.map(item => {
      try {
        const link = item.link || item.displayed_link || item.cached_page_link || '';
        const domain = link ? (new URL(link)).hostname.replace(/^www\./, '') : (item.displayed_link || '');
        return {
          title: item.title || item.position_title || '',
          link: link,
          snippet: item.snippet || item.snippet_highlighted || '',
          domain
        };
      } catch (e) {
        return {
          title: item.title || '',
          link: item.link || '',
          snippet: item.snippet || '',
          domain: item.displayed_link || ''
        };
      }
    });

    return out;
  } catch (e) {
    // non blocking: log and return empty array
    console.warn('fetchSERP error', e && e.message ? e.message : e);
    return [];
  }
}

module.exports = { fetchSERP };
