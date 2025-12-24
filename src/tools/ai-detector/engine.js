// tools/ai-detector/engine.js

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

function analyzeText(text) {
  const words = tokenize(text);
  const sentences = sentenceSplit(text);

  const wordCount = words.length;
  const sentenceCount = sentences.length || 1;

  const sentenceLengths = sentences.map(s => tokenize(s).length);
  const sentenceVariance = variance(sentenceLengths);

  let uniformSentences = false;
  if (sentenceLengths.length >= 3) {
    const maxLen = Math.max(...sentenceLengths);
    const minLen = Math.min(...sentenceLengths);
    if (maxLen - minLen <= 3) uniformSentences = true;
  }

  const freq = wordFrequency(words);
  const repeatedWords = Object.values(freq).filter(c => c > 3).length;

  const uniqueWords = Object.keys(freq).length;
  const vocabRatio = uniqueWords / wordCount || 0;

  const burstScore = sentenceVariance > 25 ? 1 : 0;

  return {
    wordCount,
    sentenceCount,
    vocabRatio,
    sentenceVariance,
    repeatedWords,
    uniformSentences,
    burstScore
  };
}

module.exports = {
  analyzeText
};
