// routes/ai-detector.js
const express = require('express');
const router = express.Router();
const detectAI = require('../utils/aiContentDetector'); // your detection util

// POST /api/ai-detect
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const text = body.text || body.urlText || '';
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'missing text' });
    }

    const result = await detectAI(text);
    return res.json({ ok: true, result });
  } catch (err) {
    console.error('AI detector error:', err);
    return res.status(500).json({ error: 'internal error' });
  }
});

module.exports = router;
