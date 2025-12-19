function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

function sentenceSplit(text) {
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function wordFrequency(words) {
  const map = {};
  for (const w of words) map[w] = (map[w] || 0) + 1;
  return map;
}

function variance(arr) {
  if (!arr.length) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
}

module.exports = async function detectAI(text) {
  const words = tokenize(text);
  const sentences = sentenceSplit(text);
  const wordCount = words.length;
  const sentenceCount = sentences.length || 1;

  const lowerText = text.toLowerCase();

  const humanMarkers = [
    "i think",
    "i believe",
    "in my experience",
    "from my experience",
    "i noticed",
    "we found",
    "personally",
    "in my opinion"
  ];

  // confidence
  let confidence = "high";
  if (wordCount < 200) confidence = "medium";
  if (wordCount < 80) confidence = "low";

  // sentence length analysis
  const sentenceLengths = sentences.map(s => tokenize(s).length);
  const sentenceVariance = variance(sentenceLengths);

  // uniform sentence structure
  let uniformSentences = false;
  if (sentenceLengths.length >= 3) {
    const maxLen = Math.max(...sentenceLengths);
    const minLen = Math.min(...sentenceLengths);
    if (maxLen - minLen <= 3) uniformSentences = true;
  }

  // repetition
  const freq = wordFrequency(words);
  const repeatedWords = Object.values(freq).filter(c => c > 3).length;

  // vocabulary richness
  const uniqueWords = Object.keys(freq).length;
  const vocabRatio = uniqueWords / wordCount || 0;

  // burstiness proxy
  const burstScore = sentenceVariance > 25 ? 1 : 0;

  // scoring
  let aiScore = 0;

  if (vocabRatio < 0.45) aiScore += 25;
  if (sentenceVariance < 15) aiScore += 25;
  if (repeatedWords > 5) aiScore += 20;
  if (!burstScore) aiScore += 15;
  if (sentenceCount > 3 && sentenceVariance < 10) aiScore += 15;
  if (uniformSentences) aiScore += 15;

  if (aiScore > 100) aiScore = 100;

  // human language bonus
  let humanBonus = 0;
  humanMarkers.forEach(marker => {
    if (lowerText.includes(marker)) {
      humanBonus += 10;
    }
  });

  aiScore -= humanBonus;
  if (aiScore < 0) aiScore = 0;

  // verdict
  let verdict = "human";
  if (aiScore >= 70) verdict = "likely-ai";
  else if (aiScore >= 40) verdict = "mixed";

  return {
    verdict,
    aiProbability: aiScore,
    confidence,
    signals: {
      vocabularyRichness: Number(vocabRatio.toFixed(2)),
      sentenceVariance: Number(sentenceVariance.toFixed(2)),
      repeatedWordClusters: repeatedWords,
      burstiness: burstScore ? "human-like" : "flat",
      uniformSentences
    },
    explanation:
      verdict === "human"
        ? "Sentence structure and wording show natural human variation."
        : verdict === "mixed"
        ? "Some AI-like structure detected, but human phrasing is also present."
        : "Highly uniform sentence structure and generic phrasing detected."
  };
};
