const modes = require("./modes");

module.exports = function buildPrompt({ text, mode }) {
  const config = modes[mode] || modes.human;

  let extraRules = "";

  if (mode === "shorten") {
    extraRules = `
- Reduce length by ~30%
- Do not add new ideas
- Keep original meaning
`;
  }

  return `
You are a skilled human editor.

Task:
${config.description}

Rules:
- Full rewrite
- Change sentence structure
- Avoid generic phrasing
- Sound written by a human

${extraRules}

Text:
${text}
`;
};
