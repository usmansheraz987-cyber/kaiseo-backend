const natural = require('natural');
const stopwords = require('natural/lib/natural/util/stopwords').words || require('stopword').en;
const tokenizer = new natural.WordTokenizer();

function stripHtml(text) {
  if (!text) return '';
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function analyzeTextFallback(text, { topK = 10 } = {}) {
  const clean = stripHtml(text).toLowerCase();
  const tokens = tokenizer.tokenize(clean).map(t => t.replace(/[^a-z0-9-]/g,'')).filter(Boolean);
  const filtered = tokens.filter(t => !stopwords.includes(t) && t.length > 2);
  const counts = {};
  filtered.forEach(t => counts[t] = (counts[t] || 0) + 1);
  const entries = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, topK);
  const totalWords = filtered.length || 1;
  return entries.map(([keyword, count]) => ({ keyword, count, density: +(count/totalWords*100).toFixed(2) }));
}

module.exports = {
  analyzeTextFallback,
  stripHtml
};
