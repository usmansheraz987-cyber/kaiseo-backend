module.exports = function buildPrompt({ text, mode }) {
  let instruction = "";

  switch (mode) {
    case "formal":
      instruction =
        "Rewrite in a formal, professional tone. Avoid contractions. Be precise and neutral.";
      break;

    case "casual":
      instruction =
        "Rewrite in a relaxed, conversational tone. Sound natural and approachable.";
      break;

    case "academic":
      instruction =
        "Rewrite in an academic tone. Be objective, structured, and analytical.";
      break;

    case "seo":
      instruction =
        "Rewrite with SEO clarity. Improve structure, readability, and natural keyword usage without stuffing.";
      break;

    case "shorten":
      instruction =
        "Rewrite the text to be shorter while keeping the original meaning intact.";
      break;

    case "anti-ai":
      instruction =
        "Rewrite to avoid generic AI phrasing. Use varied sentence length and natural human rhythm.";
      break;

    case "human":
    default:
      instruction =
        "Rewrite to sound natural, human, and clear. Avoid generic phrasing.";
  }

  return `
${instruction}

Rules:
- Keep the original meaning
- Do not add new facts
- Improve clarity and flow
- Avoid filler and repetition

Text:
"${text}"

Return only the rewritten text.
`;
};
