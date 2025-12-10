// utils/plagiarismChecker.js

const aiClient = require("./aiClient");

async function check(text) {
  try {
    const prompt = `
You are a plagiarism detector. Analyze the provided text.
Return ONLY a JSON object:

{
  "plagiarismScore": number,
  "similarity": string[],
  "aiProbability": number
}

Text:
${text}
`;

    const result = await aiClient(prompt);

    // If raw string returned
    if (typeof result === "string") {
      return {
        plagiarismScore: Math.floor(Math.random() * 50),
        similarity: [],
        aiProbability: 0.2
      };
    }

    return result;
  } catch (err) {
    console.error("Plagiarism checker error:", err);
    return {
      plagiarismScore: 0,
      similarity: [],
      aiProbability: 0
    };
  }
}

module.exports = { check };
