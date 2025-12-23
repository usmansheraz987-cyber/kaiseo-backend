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

  // ==================================================
  // SENTENCE FIX MODE (PREMIUM – EARLY EXIT)
  // ==================================================
  if (mode === "sentence-fix") {
    const insights = analyzeInsights(text);
    let fixedSentences = [];
    let afterText = text;

    for (const s of insights.sentences || []) {
      if (!s.flags) continue;

      if (s.flags.includes("generic") || s.flags.includes("vague")) {
        const fixed = await rewriteSentence({
          sentence: s.text,
          hint: s.hint,
          mode: "human"
        });

        if (fixed && fixed !== s.text) {
          fixedSentences.push({
            index: s.index,
            original: s.text,
            fixed
          });
        }
      }
    }

    // Build AFTER text (replace only fixed sentences)
    for (const f of fixedSentences) {
      afterText = afterText.replace(f.original, f.fixed);
    }

    return {
      status: "success",
      mode: "sentence-fix",
      beforeText: text,
      afterText,
      fixedSentences,
      summary: {
        weakSentences: fixedSentences.length,
        fixed: fixedSentences.length
      }
    };
  }

  // ==================================================
  // NORMAL PARAPHRASER FLOW (ALL OTHER MODES)
  // ==================================================
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
