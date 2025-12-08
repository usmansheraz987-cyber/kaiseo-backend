// utils/serpScraper.js
// Lightweight SerpAPI wrapper that returns top organic results.
// Requires: npm install axios
const axios = require("axios");
const url = require("url");

const SERPAPI_KEY = process.env.SERPAPI_KEY || "";

if (!SERPAPI_KEY) {
  // keep module loadable; we'll throw inside function if key missing
}

function domainFromUrl(u) {
  try {
    return (new URL(u)).hostname.replace(/^www\./, "");
  } catch (e) {
    return null;
  }
}

/**
 * fetchSERP(query) -> returns array of organic results:
 * [{ position, title, snippet, link, domain }, ...]
 */
async function fetchSERP(query, opts = {}) {
  if (!SERPAPI_KEY) {
    throw new Error("SERPAPI_KEY env var not set. See README / instructions.");
  }
  const params = {
    q: query,
    api_key: SERPAPI_KEY,
    engine: "google",
    num: opts.num || 10,        // top N
    hl: opts.hl || "en",
    gl: opts.gl || "us"
  };

  const endpoint = "https://serpapi.com/search.json";

  try {
    const res = await axios.get(endpoint, { params, timeout: 15_000 });
    const data = res.data || {};

    // SerpAPI returns 'organic_results' usually
    const org = data.organic_results || data.organic || [];

    const results = (Array.isArray(org) ? org : [])
      .filter(r => r.link || r.url || r.position)
      .slice(0, params.num)
      .map((r, idx) => {
        const link = r.link || r.url || r.position?.link || null;
        const title = r.title || r.rich_snippet?.top?.string || r.rich_snippet?.top?.text || "";
        const snippet = r.snippet || r.rich_snippet?.top?.snippet || r.rich_snippet?.top?.detected_extensions || "";
        return {
          position: r.position || idx + 1,
          title: title || "",
          snippet: snippet || (r.snippet || ""),
          link: link || "",
          domain: link ? domainFromUrl(link) : (r.displayed_link || r.domain || "")
        };
      });

    return results;
  } catch (err) {
    // surface a friendly error
    // do not leak API key or raw network error in production
    console.error("fetchSERP error:", (err && err.message) || err);
    return [];
  }
}

module.exports = { fetchSERP };
