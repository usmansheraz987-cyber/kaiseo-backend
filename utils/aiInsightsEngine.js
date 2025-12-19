const tokenize = text =>
  text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

const sentenceSplit = text =>
  text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(Boolean);

const GENERIC_PHRASES = [
  "helps",
  "improves",
  "is a strategy",
  "effective way",
  "important for",
  "plays a role",
  "used to"
];

module.exports = function analyzeInsights(text) {
  const sentences = sentenceSplit(text);
  const insights = [];

  // 1️⃣ sentence-level scan
  sentences.forEach((sentence, index) => {
    const words = tokenize(sentence);
    const flags = [];
    let hint = "";

    // candidate uniform-length (not final yet)
    if (words.length >= 10 && words.length <= 14) {
      flags.push("candidate-uniform");
    }

    // generic language (context-aware)
    GENERIC_PHRASES.forEach(p => {
      if (
        sentence.toLowerCase().includes(p) &&
        !sentence.match(/\b(i|we|my|our|\d+|example|case)\b/i)
      ) {
        flags.push("generic");
      }
    });

    // vague sentence
    if (words.length < 6) {
      flags.push("vague");
    }

    // hint selection (soft + human)
    if (flags.includes("generic")) {
      hint =
        "This sentence sounds abstract. Try grounding it with a real example or outcome.";
    } else if (flags.includes("uniform-length")) {
      hint =
        "Several sentences have similar rhythm. Vary sentence length to sound more natural.";
    } else if (flags.includes("vague")) {
      hint =
        "This idea is brief. Clarify it with more context or specificity.";
    }

    // skip low-value noise (only-vague)
    if (!(flags.length === 1 && flags[0] === "vague") && flags.length) {
      insights.push({
        index: index + 1,
        text: sentence,
        flags,
        hint
      });
    }
  });

  // 2️⃣ finalize uniform-length ONLY if repeated
  const uniformCandidates = insights.filter(s =>
    s.flags.includes("candidate-uniform")
  );

  if (uniformCandidates.length >= 2) {
    uniformCandidates.forEach(s => {
      s.flags = s.flags.map(f =>
        f === "candidate-uniform" ? "uniform-length" : f
      );
    });
  } else {
    insights.forEach(s => {
      s.flags = s.flags.filter(f => f !== "candidate-uniform");
    });
  }

  const overallSuggestions = [
    "Vary sentence length",
    "Reduce generic definitions",
    "Add personal context"
  ];

  return {
    sentences: insights,
    overallSuggestions
  };
};
