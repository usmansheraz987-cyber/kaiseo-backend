const express = require('express');
const router = express.Router();
const contentImprover = require('../utils/content-improver');

const MAX_SIZE = 200_000;

// POST /api/content-improver
router.post('/', (req, res) => {
  try {
    const { text, title, metaDescription } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (text.length > MAX_SIZE) {
      return res.status(400).json({ error: 'Text too large' });
    }

    const result = contentImprover({
      text,
      title: title || null,
      metaDescription: metaDescription || null
    });

    return res.json({
      mode: 'content-improver',
      ...result
    });

  } catch (err) {
    console.error('content-improver error:', err);
    return res.status(500).json({
      error: 'internal error',
      debug: err?.message || String(err)
    });
  }
});

module.exports = router;
