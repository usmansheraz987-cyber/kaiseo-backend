const buildPrompt = require("./promptBuilder");
const rewrite = require("./rewriteEngine");
const validate = require("./validator");
const score = require("./scorer");
const modes = require("./modes");

const analyzeInsights = require("../../../utils/aiInsightsEngine");
const rewriteSentence = require("./sentenceRewriter");



const MAX_RETRIES = 3;

async function runParaphraser({ text, mode = "human" }) {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid text");
  }

  const insightsBefore = analyzeInsights(text);
  let output = "";
  let attempts = 0;
  let validation = null;

  while (attempts < MAX_RETRIES) {
    attempts++;

const modeConfig = modes[mode] || modes.human;
const prompt = buildPrompt({ text, mode });

output = await rewrite({
  prompt,
  temperatureRange: modeConfig.temperatureRange
});

    const insightsAfter = analyzeInsights(output);
    const sentenceSuggestions = [];

for (const s of insightsBefore.sentences || []) {
  if (!s.flags || s.flags.length === 0) continue;

  if (s.flags.includes("generic") || s.flags.includes("vague")) {
    const suggestion = await rewriteSentence({
      sentence: s.text,
      hint: s.hint,
      mode
    });

    if (suggestion && suggestion !== s.text) {
      sentenceSuggestions.push({
        index: s.index,
        original: s.text,
        suggestion
      });
    }
  }
}

    validation = validate({
      original: text,
      rewritten: output,
      insightsBefore,
      insightsAfter
    });

    if (validation.valid) {
      const scoring = score(insightsBefore, insightsAfter);

      return {
        status: "success",
        mode,
        input: text,
        output,
        retriesUsed: attempts,
        insights: {
          before: insightsBefore,
          after: insightsAfter
        },
        sentenceSuggestions,
        score: scoring
      };
    }
  }

  return {
    status: "warning",
    message: "Best possible rewrite returned",
    output,
    retriesUsed: attempts,
    validation
  };
}

module.exports = {
  runParaphraser
};
