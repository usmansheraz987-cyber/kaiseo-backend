const express = require('express');
const router = express.Router();
const { analyzeTextFallback } = require('../utils/keywordExtractor');

const MAX_SIZE = 200_000;
const MIN_WORDS = 100;

// POST /api/keyword-stuffing
router.post('/', (req, res) => {
  try {
    const text = (req.body?.text || '').trim();

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (text.length > MAX_SIZE) {
      return res.status(400).json({ error: 'Text too large' });
    }

    const totalWords = text.split(/\s+/).filter(Boolean).length;

    const keywords = analyzeTextFallback(text, { topK: 20 });

    const results = keywords.map(k => {
      const density = (k.count / totalWords) * 100;

      let status = 'safe';
      let recommendation = 'Keyword usage looks natural.';

      // 🚫 Short text protection
      if (totalWords < MIN_WORDS) {
        status = 'insufficient-data';
        recommendation =
          'Text is too short to accurately evaluate keyword stuffing. Add more content.';
      } else {
        if (density > 4) {
          status = 'stuffing';
          recommendation =
            'Reduce usage. Replace repetitions with synonyms or remove duplicates.';
        } else if (density > 2.5) {
          status = 'warning';
          recommendation =
            'Consider lowering frequency slightly for better readability.';
        }
      }

      return {
        keyword: k.keyword,
        count: k.count,
        density: Number(density.toFixed(2)),
        status,
        recommendation
      };
    });

    return res.json({
      mode: 'keyword-stuffing',
      totalWords,
      minWordsRequired: MIN_WORDS,
      results
    });

  } catch (err) {
    console.error('keyword-stuffing error:', err);
    return res.status(500).json({
      error: 'internal error',
      debug: err?.message || String(err)
    });
  }
});

module.exports = router;
