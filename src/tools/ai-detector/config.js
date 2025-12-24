// tools/ai-detector/config.js

module.exports = {
  minWords: 50,
  confidenceThresholds: {
    low: 80,
    medium: 200
  },
  verdictThresholds: {
    likelyAI: 70,
    mixed: 40
  }
};
