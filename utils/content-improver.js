// utils/content-improver.js

function tokenize(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

function unique(arr) {
  return [...new Set(arr)];
}

function analyzeContent({ text, title = "", metaDescription = "" }) {
  const words = tokenize(text);
  const wordCount = words.length;

  /* =========================
     SUMMARY
  ========================= */
  const recommendedWords = 1200;

  const contentDepth =
    wordCount < 100 ? "very thin" :
    wordCount < 400 ? "thin" :
    wordCount < 800 ? "average" :
    "good";

  /* =========================
     ISSUES
  ========================= */
  const issues = [];

  if (!title.trim()) issues.push("Missing title");
  if (!metaDescription.trim()) issues.push("Missing meta description");
  if (wordCount < 300) issues.push("Content is thin for the topic");

  /* =========================
     COMPETITOR BENCHMARK (LOGIC BASED)
  ========================= */
  const competitorBenchmark = {
    averageWordCount: 1400,
    recommendedMin: 900,
    recommendedIdeal: 1600,
    commonSections: [
      "What is SEO",
      "How SEO works",
      "Why SEO matters",
      "Examples"
    ]
  };

  /* =========================
     SEMANTIC COVERAGE
  ========================= */
  const expectedTopics = [
    "seo",
    "search engines",
    "ranking",
    "keywords",
    "content",
    "optimization",
    "technical",
    "backlinks"
  ];

  const coveredTopics = expectedTopics.filter(t =>
    words.includes(t)
  );

  const missingTopics = expectedTopics.filter(
    t => !coveredTopics.includes(t)
  );

  const semanticCoverage = {
    score: Math.round((coveredTopics.length / expectedTopics.length) * 100),
    coveredTopics,
    missingTopics
  };

  /* =========================
     EXPANSION PLAN
  ========================= */
  const expansionPlan = {
    currentWords: wordCount,
    targetWords: recommendedWords,
    sectionsToAdd: [
      {
        title: "What is SEO?",
        targetWords: 200,
        why: "Missing core definition"
      },
      {
        title: "How SEO helps websites rank",
        targetWords: 300,
        why: "Primary search intent"
      },
      {
        title: "How search engines evaluate content",
        targetWords: 300,
        why: "Builds topical authority"
      }
    ]
  };

  /* =========================
     EXECUTION ORDER
  ========================= */
  const executionOrder = [
    "Add a clear, keyword-focused title",
    "Write a compelling meta description",
    "Expand content to at least 900 words",
    "Add 3–5 meaningful subheadings",
    "Cover missing semantic topics",
    "Include examples or explanations"
  ];

  return {
    mode: "content-improver",
    summary: {
      wordCount,
      recommendedWords,
      contentDepth
    },
    issues,
    competitorBenchmark,
    semanticCoverage,
    expansionPlan,
    executionOrder
  };
}

module.exports = { analyzeContent };
