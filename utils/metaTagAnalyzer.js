const axios = require("axios");
const cheerio = require("cheerio");

async function analyzeMetaTags(url) {
  const response = await axios.get(url, {
    timeout: 10000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; KaiSEO/1.0)"
    }
  });

  const html = response.data;
  const $ = cheerio.load(html);

  const title = $("title").text().trim();
  const description =
    $('meta[name="description"]').attr("content") || "";
  const robots =
    $('meta[name="robots"]').attr("content") || "";
  const canonical =
    $('link[rel="canonical"]').attr("href") || "";

  const openGraph = {};
  $('meta[property^="og:"]').each((_, el) => {
    openGraph[$(el).attr("property")] = $(el).attr("content");
  });

  const twitter = {};
  $('meta[name^="twitter:"]').each((_, el) => {
    twitter[$(el).attr("name")] = $(el).attr("content");
  });

  return {
    title: {
      value: title,
      length: title.length,
      status:
        !title
          ? "missing"
          : title.length < 30 || title.length > 60
          ? "needs-improvement"
          : "good"
    },
    description: {
      value: description,
      length: description.length,
      status:
        !description
          ? "missing"
          : description.length < 70 || description.length > 160
          ? "needs-improvement"
          : "good"
    },
    robots: robots || "not-set",
    canonical: canonical || "not-set",
    openGraph,
    twitter
  };
}

module.exports = analyzeMetaTags;
