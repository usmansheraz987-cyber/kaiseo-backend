// utils/serpScraper.js
const axios = require("axios");
const cheerio = require("cheerio");

async function fetchSERP(query) {
  try {
    const q = encodeURIComponent(query);
    const url = `https://www.google.com/search?q=${q}&hl=en`;

    const res = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
      }
    });

    const $ = cheerio.load(res.data);
    const results = [];

    $(".tF2Cxc").each((_, el) => {
      const title = $(el).find("h3").text().trim();
      const link = $(el).find("a").attr("href");
      const snippet = $(el).find(".VwiC3b").text().trim();

      if (title && link) {
        results.push({
          title,
          link,
          snippet
        });
      }
    });

    return results.slice(0, 5); // top 5 competitors
  } catch (err) {
    console.error("SERP Error:", err);
    return [];
  }
}

module.exports = { fetchSERP };
