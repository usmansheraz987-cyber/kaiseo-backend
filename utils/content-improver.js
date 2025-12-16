const openai = require("./aiClient");

async function improveContent({ text, goal }) {
  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: `Improve the following content for SEO.

Goal:
${goal}

Content:
${text}

Return improved content only.`
  });

  const improvedText = response.output_text;

  if (!improvedText) {
    throw new Error("AI returned empty output");
  }

  return improvedText;
}

module.exports = {
  improveContent
};
