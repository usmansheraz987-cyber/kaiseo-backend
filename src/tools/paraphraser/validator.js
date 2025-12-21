module.exports = function validate({ original, rewritten, insightsBefore, insightsAfter }) {
  if (!rewritten || rewritten.length < original.length * 0.7) {
    return { valid: false, reason: "Too short or empty" };
  }

  if (
    insightsAfter.sentences.length >= insightsBefore.sentences.length
  ) {
    return { valid: false, reason: "No structural improvement" };
  }

  return { valid: true };
};
