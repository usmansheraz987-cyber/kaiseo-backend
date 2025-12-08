const assert = require('assert');
const scoreSeo = require('../utils/seoScore');

const res = scoreSeo({
  title: "Test",
  metaDescription: "desc",
  headings: [{level:1, text:"A"}],
  images: [{src:'x', alt:''}],
  links: {internal: ['/a'], external:[]},
  wordText: "this is a sample ".repeat(100),
  readability: {flesch: 55},
  keywords: [{keyword:'seo',count:3}],
  semantic: {semanticKeywords:['seo','tools'], keyphrases:['seo tools'], clusters:[]},
  technical: {canonical: 'https://a', mobileFriendly: true},
  performance: {lcp:2.2, cls:0.05},
  competitors: [{wordCount:1200}]
});

assert(res.score >= 0 && res.score <= 100, 'score in range');
assert(res.details.content.wordCount > 0);
console.log('seoScore test OK', res.score);
