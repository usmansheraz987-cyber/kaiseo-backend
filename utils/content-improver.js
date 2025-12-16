const aiClient = require("./aiClient");

module.exports = async function improveContent({ text, goal = "improve seo" }) {
  if (!text || typeof text !== "string") {
    throw new Error("Text is required for content improvement");
  }

  const prompt = `
You are an SEO content expert.
Goal: ${goal}

Improve the following content for clarity, SEO, structure, and usefulness.
Do not add fluff. Keep it factual and actionable.

CONTENT:
${text}
`;

  const response = await aiClient.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
  });

  return {
    improvedContent: response.choices[0].message.content.trim(),
  };
};
