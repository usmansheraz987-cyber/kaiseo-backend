// utils/semanticEngine.js
const nlp = require('compromise');
const stopword = require('stopword');

function normalize(s){
  return (s||'').toLowerCase().replace(/[^\w\s-]/g, '').trim();
}

// extract candidate phrases using compromise (noun chunks) + ngrams fallback
function extractPhrases(text){
  if(!text) return [];
  const doc = nlp(text);
  // noun chunks and topics
  const nounPhrases = doc.nouns().out('array'); // e.g. ["keyword research", "SEO tools"]
  // fallback: include significant n-grams
  const words = normalize(text).split(/\s+/).filter(Boolean);
  const filtered = stopword.removeStopwords(words);
  const bigrams = [];
  for(let i=0;i<filtered.length-1;i++){
    bigrams.push(filtered[i] + ' ' + filtered[i+1]);
  }
  const trigrams = [];
  for(let i=0;i<filtered.length-2;i++){
    trigrams.push(filtered[i] + ' ' + filtered[i+1] + ' ' + filtered[i+2]);
  }
  const candidates = [...nounPhrases, ...bigrams.slice(0,200), ...trigrams.slice(0,200)].map(c => normalize(c)).filter(Boolean);
  // dedupe and keep original case-insensitive uniqueness
  return Array.from(new Set(candidates));
}

// count frequency / score with simple TF heuristic
function scorePhrases(text, phrases, topK=20){
  const lower = normalize(text);
  const results = [];
  for(const p of phrases){
    const rx = new RegExp('\\b'+escapeRegExp(p)+'\\b','g');
    const matches = lower.match(rx);
    const count = matches ? matches.length : 0;
    if(count > 0) results.push({ keyword: p, count, score: count /* basic */ });
  }
  // sort by count desc then length desc
  results.sort((a,b)=> b.count - a.count || b.keyword.length - a.keyword.length);
  return results.slice(0, topK);
}

function escapeRegExp(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// cluster keywords by shared token (very simple)
function clusterKeywords(list){
  // list: [{keyword,count,score}]
  const clusters = [];
  const used = new Set();
  for(let i=0;i<list.length;i++){
    if(used.has(list[i].keyword)) continue;
    const base = list[i].keyword;
    const tokens = base.split(' ');
    const group = [list[i]];
    used.add(base);
    for(let j=i+1;j<list.length;j++){
      if(used.has(list[j].keyword)) continue;
      const other = list[j].keyword;
      const otoks = other.split(' ');
      const shared = tokens.filter(t=> otoks.includes(t));
      if(shared.length > 0){
        group.push(list[j]);
        used.add(other);
      }
    }
    clusters.push({
      seed: base,
      items: group
    });
  }
  return clusters;
}

// public function: generate semantic keywords + clusters
function analyzeSemantics(text, { topK = 20 } = {}){
  const phrases = extractPhrases(text);
  const scored = scorePhrases(text, phrases, topK*3);
  const top = scored.slice(0, topK);
  const clusters = clusterKeywords(top);
  // also generate a simple "semanticKeywords" list (keyword strings)
  const semanticKeywords = top.map(k=>k.keyword);
  return { semanticKeywords, keyphrases: top, clusters };
}

module.exports = { analyzeSemantics };
