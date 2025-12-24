// tools/ai-detector/validator.js

function validateText(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid input");
  }

  const trimmed = text.trim();
  if (trimmed.length < 50) {
    throw new Error("Text too short for AI detection");
  }

  return trimmed;
}

function getConfidence(wordCount) {
  if (wordCount < 80) return "low";
  if (wordCount < 200) return "medium";
  return "high";
}

module.exports = {
  validateText,
  getConfidence
};
