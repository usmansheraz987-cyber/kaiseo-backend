// FINAL ORCHESTRATOR — FORCE REWRITE + VARIATION

const { callOpenAI } = require("../utils/aiClient");
const { analyzeInsights } = require("../utils/insightsEngine");
const { detectAI } = require("../utils/aiContentDetector");

const MAX_RETRIES = 3;

// ---------- HELPERS ----------

function isValidText(text) {
  return typeof text === "string" && text.trim().length >= 2;
}

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomTemperature() {
  return Number((0.75 + Math.random() * 0.35).toFixed(2)); // 0.75 → 1.1
}

function buildRewritePrompt(text, mode) {
  const rewriteStyles = [
    "Rewrite using a different sentence structure and phrasing.",
    "Rewrite as a natural human would explain it casually.",
    "Rewrite by reordering ideas and changing tone.",
    "Rewrite with different wording, flow, and rhythm.",
    "Rewrite using simpler phrasing but new structure.",
    "Rewrite creatively while preserving meaning."
  ];

  const forceRules = `
RULES (MANDATORY):
- You MUST rewrite the text.
- Do NOT reuse sentence structure.
- Do NOT keep the same phrasing.
- Change word order, clauses, and flow.
- Output ONLY the rewritten text.
`;

  return `
${randomPick(rewriteStyles)}

${forceRules}

TEXT:
"${text}"
`;
}

// ---------- MAIN ----------

async function runParaphraser({ text, mode = "human" }) {
  if (!isValidText(text)) {
    throw new Error("Invalid input text");
  }

  // Always analyze original
  const beforeAI = await detectAI(text);
  const beforeInsights = analyzeInsights(text);

  let output = text;
  let retries = 0;

  // 🔥 KEY RULE: anti-ai ALWAYS rewrites
  const mustRewrite = mode === "anti-ai";

  if (mustRewrite) {
    while (retries < MAX_RETRIES) {
      retries++;

      const prompt = buildRewritePrompt(text, mode);

      const candidate = await callOpenAI({
        prompt,
        temperature: randomTemperature()
      });

      if (candidate && candidate.trim() && candidate.trim() !== text.trim()) {
        output = candidate.trim();
        break;
      }
    }
  }

  // Analyze rewritten text
  const afterAI = await detectAI(output);
  const afterInsights = analyzeInsights(output);

  return {
    status: "success",
    mode,
    input: text,
    output,
    retriesUsed: retries,
    forcedRewrite: mustRewrite,

    comparison: {
      beforeText: text,
      afterText: output,
      aiProbabilityDrop: beforeAI.aiProbability - afterAI.aiProbability,
      verdictChange: `${beforeAI.verdict} → ${afterAI.verdict}`,
      summary:
        mustRewrite
          ? "Forced rewrite applied. Structural variation enforced."
          : "Standard rewrite applied."
    },

    aiDetection: {
      before: beforeAI,
      after: afterAI
    },

    insights: {
      before: beforeInsights,
      after: afterInsights
    }
  };
}

module.exports = {
  runParaphraser
};
