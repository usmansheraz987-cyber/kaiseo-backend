// utils/contentImprover.js

function getWordCount(text = "") {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function suggestSections(text) {
  const base = [
    {
      title: "What is SEO?",
      reason: "Explains the core concept for beginners"
    },
    {
      title: "How SEO helps websites rank",
      reason: "Matches primary search intent"
    },
    {
      title: "How search engines evaluate content",
      reason: "Builds topical authority"
    }
  ];

  return base;
}

function detectContentGaps(wordCount) {
  const gaps = [];

  if (wordCount < 300) gaps.push("Content is too short to explain the topic");
  if (wordCount < 600) gaps.push("No supporting examples or explanations");
  if (wordCount < 1000) gaps.push("Lacks depth compared to ranking pages");

  return gaps;
}

function expansionBlueprint() {
  return {
    introduction: 150,
    coreSections: 800,
    examples: 150,
    conclusion: 100
  };
}

function readabilityTarget() {
  return {
    recommendedScore: "60–70 (Standard)",
    why: "Improves engagement and reduces bounce rate"
  };
}

function executionOrder() {
  return [
    "Add a clear, keyword-focused title",
    "Write a compelling meta description",
    "Expand content to at least 800 words",
    "Add 3–5 meaningful subheadings",
    "Include examples or explanations"
  ];
}

function analyzeContent({ text = "", title = "", metaDescription = "" }) {
  const wordCount = getWordCount(text);

  return {
    mode: "content-improver",
    summary: {
      wordCount,
      recommendedWords: 1200,
      contentDepth:
        wordCount < 300 ? "very thin" :
        wordCount < 800 ? "thin" :
        "good"
    },
    issues: [
      !title && "Missing title",
      !metaDescription && "Missing meta description",
      wordCount < 800 && "Content is thin for the topic"
    ].filter(Boolean),
    improvements: {
      addSections: suggestSections(text),
      contentGaps: detectContentGaps(wordCount),
      expansionPlan: expansionBlueprint(),
      readabilityTarget: readabilityTarget()
    },
    executionOrder: executionOrder()
  };
}

module.exports = { analyzeContent };
