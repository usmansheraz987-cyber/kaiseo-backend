const { generateText } = require("../../../utils/aiClient");

module.exports = async function rewriteSentence({
  sentence,
  hint,
  mode
}) {
  if (!sentence || typeof sentence !== "string") {
    return null;
  }

  const prompt = `
Rewrite the following sentence to sound more human and specific.

Rules:
- Keep the original meaning
- Avoid generic phrases
- Add light realism or context
- Do NOT add extra claims

Sentence:
"${sentence}"

Hint:
"${hint || "Make it more concrete and natural."}"

Return ONLY the rewritten sentence.
`;

  try {
    const rewritten = await generateText(prompt, {
      temperature: mode === "formal" ? 0.4 : 0.8,
      maxTokens: 80
    });

    return rewritten.trim();
  } catch {
    return null;
  }
};
