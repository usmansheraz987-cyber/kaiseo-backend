module.exports = {
  analyze(text) {
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const words = text.split(/\s+/).filter(Boolean);
    const syllables = words.reduce((acc, w) => acc + countSyllables(w), 0);

    const sentenceCount = sentences.length || 1;
    const wordCount = words.length || 1;

    const flesch =
      206.835 -
      1.015 * (wordCount / sentenceCount) -
      84.6 * (syllables / wordCount);

    const grade =
      0.39 * (wordCount / sentenceCount) +
      11.8 * (syllables / wordCount) -
      15.59;

    return {
      score: Number(flesch.toFixed(2)),
      gradeLevel: Number(grade.toFixed(2)),
      sentences: sentenceCount,
      words: wordCount,
      syllables,
      difficulty:
        flesch >= 90 ? "Very Easy" :
        flesch >= 80 ? "Easy" :
        flesch >= 70 ? "Fairly Easy" :
        flesch >= 60 ? "Standard" :
        flesch >= 50 ? "Fairly Difficult" :
        flesch >= 30 ? "Difficult" :
        "Very Difficult"
    };
  }
};

function countSyllables(word) {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;

  const matches = word.match(/[aeiouy]+/g);
  return matches ? matches.length : 1;
}
