// tools/ai-detector/scorer.js

const HUMAN_MARKERS = [
  "i think",
  "i believe",
  "in my experience",
  "from my experience",
  "i noticed",
  "we found",
  "personally",
  "in my opinion"
];

function scoreResult(metrics, text, confidence) {
  const {
    vocabRatio,
    sentenceVariance,
    repeatedWords,
    uniformSentences,
    burstScore,
    sentenceCount
  } = metrics;

  let aiScore = 0;

  if (vocabRatio < 0.45) aiScore += 25;
  if (sentenceVariance < 15) aiScore += 25;
  if (repeatedWords > 5) aiScore += 20;
  if (!burstScore) aiScore += 15;
  if (sentenceCount > 3 && sentenceVariance < 10) aiScore += 15;
  if (uniformSentences) aiScore += 15;

  if (aiScore > 100) aiScore = 100;

  let humanBonus = 0;
  const lowerText = text.toLowerCase();

  HUMAN_MARKERS.forEach(marker => {
    if (lowerText.includes(marker)) {
      humanBonus += 10;
    }
  });

  aiScore -= humanBonus;
  if (aiScore < 0) aiScore = 0;

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
}

module.exports = {
  scoreResult
};
