module.exports = function score(before, after) {
  const beforeGeneric = before.sentences.filter(s =>
    s.flags.includes("generic")
  ).length;

  const afterGeneric = after.sentences.filter(s =>
    s.flags.includes("generic")
  ).length;

  const improvement = Math.max(0, beforeGeneric - afterGeneric);

  return {
    beforeScore: Math.max(20, 60 - beforeGeneric * 5),
    afterScore: Math.min(95, 60 + improvement * 8),
    improvement: improvement
  };
};
