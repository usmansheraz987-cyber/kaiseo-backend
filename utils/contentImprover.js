const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function improveContent({ text, goal }) {
  if (!text || text.length < 20) {
    throw new Error("Text too short to improve");
  }

  const prompt = `
Improve the following content for SEO.

Goal:
${goal || "Improve clarity, structure, and SEO quality"}

Rules:
- Do NOT rewrite completely
- Improve headings, clarity, and SEO flow
- Keep meaning intact
- No fluff

Content:
${text}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "user", content: prompt }
    ],
    temperature: 0.6
  });

  return response.choices[0].message.content;
}

module.exports = { improveContent };
