const readability = require('./readability');
const { analyzeTextFallback } = require('./keywordExtractor');
const { analyzeSemantics } = require('./semanticEngine');

function estimateRecommendedWords(topicKeywords = []) {
  if (topicKeywords.length <= 3) return 600;
  if (topicKeywords.length <= 6) return 900;
  return 1200;
}

function splitIntoSections(text) {
  return [
    {
      name: 'Main Content',
      text,
      wordCount: text.split(/\s+/).filter(Boolean).length
    }
  ];
}

module.exports = function contentImprover({ text, title, metaDescription }) {
  const cleanText = (text || '').trim();
  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;

  const read = readability.analyze(cleanText);
  const keywords = analyzeTextFallback(cleanText, { topK: 10 });

  let semantic = { semanticKeywords: [], keyphrases: [], clusters: [] };
  try {
    semantic = analyzeSemantics(cleanText, { topK: 10 });
  } catch {}

  const recommendedWords = estimateRecommendedWords(semantic.semanticKeywords);

  const issues = [];
  const priorityFixes = [];

  if (!title) {
    issues.push('Missing title');
    priorityFixes.push('Add a clear, keyword-focused title');
  }

  if (!metaDescription) {
    issues.push('Missing meta description');
    priorityFixes.push('Write a compelling meta description');
  }

  if (wordCount < recommendedWords * 0.6) {
    issues.push('Content is thin for the topic');
    priorityFixes.push('Increase content depth and length');
  }

  if (read.score < 50) {
    issues.push('Low readability');
    priorityFixes.push('Simplify sentences and improve readability');
  }

  if (semantic.semanticKeywords.length < 5) {
    issues.push('Weak semantic coverage');
    priorityFixes.push('Add semantically related subtopics');
  }

  const sections = splitIntoSections(cleanText);

  const expand = sections
    .filter(s => s.wordCount < recommendedWords / sections.length)
    .map(s => ({
      section: s.name,
      currentWords: s.wordCount,
      recommendedWords: Math.ceil(recommendedWords / sections.length)
    }));

  return {
    summary: {
      wordCount,
      recommendedWords,
      contentDepth:
        wordCount < recommendedWords * 0.6 ? 'thin' :
        wordCount < recommendedWords ? 'average' :
        'good'
    },
    issues,
    improvements: {
      addSections: semantic.semanticKeywords.slice(0, 6),
      expand,
      readability: [
        'Break long sentences into shorter ones',
        'Use bullet points where possible',
        'Avoid complex or repetitive wording'
      ]
    },
    priorityFixes
  };
};
