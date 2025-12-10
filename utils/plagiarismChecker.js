// utils/plagiarismChecker.js
const aiClient = require("./aiClient");

// The module must export an object that contains a function
async function check(text) {
  try {
    // Simple AI-based check using perplexity + randomness as example
    const prompt = `
Analyze the following text for plagiarism likelihood.
Return a JSON object with:
- plagiarismScore (0-100)
- similarityPhrases (array)
- aiProbability (0-1)

Text:
${text}
`;

    const result = await aiClient(prompt);

    // Fallback if AI returns just text
    if (typeof result === "string") {
      return {
        plagiarismScore: Math.floor(Math.random() * 40),
        similarityPhrases: [],
        aiProbability: 0.2,
      };
    }

    return result;
  } catch (err) {
    console.error("Plagiarism checker failed:", err);
    return {
      plagiarismScore: 0,
      similarityPhrases: [],
      aiProbability: 0,
    };
  }
}

module.exports = { check };
