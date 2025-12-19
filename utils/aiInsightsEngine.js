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
  "in order to",
  "is a strategy",
  "plays a role",
  "important for",
  "effective way"
];

module.exports = function analyzeInsights(text) {
  const sentences = sentenceSplit(text);
  const insights = [];

  sentences.forEach((sentence, index) => {
    const words = tokenize(sentence);
    const flags = [];
    let hint = "";

    // uniform length
    if (words.length >= 8 && words.length <= 12) {
      flags.push("uniform-length");
    }

    // generic language
    GENERIC_PHRASES.forEach(p => {
      if (sentence.toLowerCase().includes(p)) {
        flags.push("generic");
      }
    });

    // vague sentence
    if (words.length < 6) {
      flags.push("vague");
    }

    if (flags.includes("generic")) {
      hint = "Add a concrete example, data point, or personal observation.";
    } else if (flags.includes("uniform-length")) {
      hint = "Vary sentence length to sound more natural.";
    } else if (flags.includes("vague")) {
      hint = "Clarify the idea with specifics or context.";
    }

    if (flags.length) {
      insights.push({
        index: index + 1,
        text: sentence,
        flags,
        hint
      });
    }
  });

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
