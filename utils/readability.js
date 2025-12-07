// Simple Flesch reading ease calculation
function countSyllables(word) {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  const syl = word
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '')
    .match(/[aeiouy]{1,2}/g);
  return syl ? syl.length : 1;
}

function computeFlesch(text) {
  if (!text) return { flesch: null, gradeLevel: null };
  const sentences = text.split(/[.!?]+/).filter(Boolean).length || 1;
  const wordsArr = text.split(/\s+/).filter(Boolean);
  const words = wordsArr.length || 1;
  let syllables = 0;
  for (const w of wordsArr) syllables += countSyllables(w);
  const ASL = words / sentences;
  const ASW = syllables / words;
  // Flesch Reading Ease
  const flesch = Math.round(206.835 - (1.015 * ASL) - (84.6 * ASW));
  const gradeLevel = Math.round((0.39 * ASL) + (11.8 * ASW) - 15.59);
  return { flesch, gradeLevel, sentences, words, syllables };
}

module.exports = { computeFlesch };
