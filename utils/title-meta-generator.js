// utils/title-meta-generator.js

function classifyIntent(topic = "", keywords = []) {
  const text = `${topic} ${keywords.join(" ")}`.toLowerCase();

  if (text.match(/buy|price|pricing|cheap|deal|order/)) return "transactional";
  if (text.match(/best|top|vs|compare|comparison/)) return "commercial";
  if (text.match(/login|signup|official|site/)) return "navigational";
  return "informational";
}

function generateTitles(topic, intent) {
  const year = new Date().getFullYear();

  const patterns = {
    informational: [
      `What Is ${topic}? A Beginner’s Guide`,
      `How ${topic} Works Explained Simply`,
      `${topic} Explained: Everything You Need to Know`
    ],
    commercial: [
      `Best ${topic} in ${year}`,
      `${topic} vs Alternatives: Which Is Better?`,
      `Top ${topic} Tools Compared`
    ],
    transactional: [
      `Buy ${topic}: Pricing, Features & Deals`,
      `${topic} Pricing: Plans and Cost Breakdown`,
      `Get ${topic} – Features, Pricing & Access`
    ],
    navigational: [
      `${topic} Official Website`,
      `${topic} Login & Account Access`,
      `${topic} Dashboard Overview`
    ]
  };

  return patterns[intent] || patterns.informational;
}

function generateMetaDescriptions(topic, intent) {
  const base = {
    informational: [
      `Learn what ${topic} is, how it works, and why it matters. Clear explanations with practical examples.`,
      `Discover everything you need to know about ${topic} in this simple, beginner-friendly guide.`
    ],
    commercial: [
      `Compare the best ${topic} options, features, and use cases to choose the right solution.`,
      `Looking for the best ${topic}? See comparisons, benefits, and expert recommendations.`
    ],
    transactional: [
      `Explore ${topic} pricing, features, and plans. Choose the best option and get started today.`,
      `Check ${topic} cost, features, and deals to make the right purchase decision.`
    ],
    navigational: [
      `Access the official ${topic} platform, login details, and account features.`,
      `Visit the official ${topic} site to manage your account and explore features.`
    ]
  };

  return base[intent] || base.informational;
}

function lengthCheck(title, meta) {
  return {
    title: {
      characters: title.length,
      status: title.length >= 30 && title.length <= 60 ? "ok" : "warning"
    },
    meta: {
      characters: meta.length,
      status: meta.length >= 120 && meta.length <= 160 ? "ok" : "warning"
    }
  };
}

function generate({ topic = "", keywords = [] }) {
  const intent = classifyIntent(topic, keywords);
  const titles = generateTitles(topic, intent);
  const metas = generateMetaDescriptions(topic, intent);

  return {
    mode: "title-meta-generator",
    searchIntent: intent,
    titleOptions: titles,
    metaDescriptions: metas,
    lengthPreview: lengthCheck(titles[0], metas[0])
  };
}

module.exports = { generate };
