// utils/serpScraper.js
const SerpApi = require('serpapi');

async function fetchSERP(query) {
  try {
    if (!query || query.length < 2) return [];

    const client = new SerpApi.GoogleSearch({ api_key: process.env.SERPAPI_KEY });

    const params = {
      q: query,
      num: 10,
      hl: "en",
      gl: "us"
    };

    const res = await client.json(params);
    const results = res.organic_results || [];

    return results.slice(0, 5).map(r => ({
      title: r.title || "",
      link: r.link || "",
      snippet: r.snippet || "",
      domain: r.displayed_link || r.domain || "",
      position: r.position || 0
    }));

  } catch (err) {
    console.error("SERP SCRAPER ERROR:", err.message || err);
    return [];
  }
}

module.exports = { fetchSERP };
