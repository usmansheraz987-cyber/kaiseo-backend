// routes/paraphrase.js
const express = require('express');
const router = express.Router();
const { callOpenAI } = require('../utils/aiClient');

// Allowed modes
const VALID_MODES = new Set([
  'humanize','rewrite','expand','shorten','grammar','seo',
  'formal','casual','academic','simple'
]);

function localFallbackRewrite(text, mode) {
  if (!text) return '';
  switch (mode) {
    case 'shorten': return text.split(' ').slice(0, 8).join(' ') + '...';
    case 'expand': return text + ' This adds a bit more explanation for clarity.';
    case 'humanize': return 'In simple words, ' + text.toLowerCase();
    case 'grammar': return text.replace(/\bi\b/g, 'I');
    default: return text;
  }
}

function buildPrompt(text, mode) {
  // concise, controlled prompt per mode
  let instruction = '';
  switch (mode) {
    case 'humanize':
      instruction = 'Rewrite this text to sound natural and human, keep the meaning.';
      break;
    case 'rewrite':
      instruction = 'Rewrite the text preserving meaning and clarity.';
      break;
    case 'expand':
      instruction = 'Expand the text adding helpful explanation and details.';
      break;
    case 'shorten':
      instruction = 'Shorten the text while preserving the core idea.';
      break;
    case 'grammar':
      instruction = 'Fix grammar, punctuation, and capitalization.';
      break;
    case 'seo':
      instruction = 'Rewrite for SEO: keep keywords, improve clarity and scannability.';
      break;
    case 'formal':
      instruction = 'Rewrite in a formal tone.';
      break;
    case 'casual':
      instruction = 'Rewrite in a casual tone.';
      break;
    case 'academic':
      instruction = 'Rewrite in an academic, precise tone.';
      break;
    default:
      instruction = 'Rewrite the text as requested.';
  }

  return `${instruction}\n\nText:\n"""${text}"""`;
}

router.post('/', async (req, res) => {
  try {
    const { text = '', mode = 'rewrite' } = req.body || {};

    if (!text || !text.toString().trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const chosenMode = VALID_MODES.has(mode) ? mode : 'rewrite';

    // Try OpenAI (if configured). If fails, fallback to local rewrite.
    try {
      const prompt = buildPrompt(text, chosenMode);
      const aiOut = await callOpenAI(prompt, 'gpt-4o-mini', 600);
      if (aiOut && aiOut.length) {
        return res.json({ input: text, mode: chosenMode, output: aiOut });
      }
      // if AI returns nothing, fall back
    } catch (err) {
      console.warn('AI call failed — falling back to local rewrite:', err.message);
    }

    // Local fallback
    const fallback = localFallbackRewrite(text, chosenMode);
    return res.json({ input: text, mode: chosenMode, output: fallback });

  } catch (err) {
    console.error('Paraphrase error', err);
    return res.status(500).json({ error: 'Failed to paraphrase', details: err.message });
  }
});

module.exports = router;

