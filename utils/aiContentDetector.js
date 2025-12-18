// utils/aiContentDetector.js

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
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
}

module.exports = async function detectAI(text) {
  const words = tokenize(text);
  const sentences = sentenceSplit(text);

  const wordCount = words.length;
  const sentenceCount = sentences.length || 1;

  // sentence length analysis
  const sentenceLengths = sentences.map(s => tokenize(s).length);
  const sentenceVariance = variance(sentenceLengths);

  // repetition
  const freq = wordFrequency(words);
  const repeatedWords = Object.values(freq).filter(c => c > 3).length;

  // vocabulary richness
  const uniqueWords = Object.keys(freq).length;
  const vocabRatio = uniqueWords / wordCount;

  // burstiness proxy
  const burstScore = sentenceVariance > 25 ? 1 : 0;

  // scoring
  let aiScore = 0;

  if (vocabRatio < 0.45) aiScore += 25;
  if (sentenceVariance < 15) aiScore += 25;
  if (repeatedWords > 5) aiScore += 20;
  if (!burstScore) aiScore += 15;
  if (sentenceCount > 3 && sentenceVariance < 10) aiScore += 15;

  if (aiScore > 100) aiScore = 100;

  let verdict = "human";
  if (aiScore >= 70) verdict = "likely-ai";
  else if (aiScore >= 40) verdict = "mixed";

  return {
    verdict,
    aiProbability: aiScore,
    signals: {
      vocabularyRichness: Number(vocabRatio.toFixed(2)),
      sentenceVariance: Number(sentenceVariance.toFixed(2)),
      repeatedWordClusters: repeatedWords,
      burstiness: burstScore ? "human-like" : "flat"
    },
    explanation:
      verdict === "human"
        ? "Natural sentence variation and vocabulary usage detected."
        : verdict === "mixed"
        ? "Some AI-like patterns found alongside human signals."
        : "Low variation, repetition, and flat structure detected."
  };
};
