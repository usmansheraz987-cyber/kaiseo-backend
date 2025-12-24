const express = require("express");
const router = express.Router();

/*
  Tool entry
  This imports the TOOL index (NOT the server index)
*/
const aiDetector = require("../tools/ai-detector");

/*
  MODE 1 — Detect
  POST /api/ai-detect
  Body: { text }
*/
router.post("/", async (req, res) => {
  return aiDetector.detect(req, res);
});

/*
  MODE 2 — Compare
  POST /api/ai-detect/compare
  Body: { original, rewritten }
*/
router.post("/compare", async (req, res) => {
  return aiDetector.compare(req, res);
});

/*
  MODE 3 — Insights
  POST /api/ai-detect/insights
  Body: { text }
*/
router.post("/insights", async (req, res) => {
  return aiDetector.insights(req, res);
});

module.exports = router;
