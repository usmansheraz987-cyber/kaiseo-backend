const express = require("express");
const router = express.Router();
const improveContent = require("../utils/content-improver");

router.post("/", async (req, res) => {
  try {
    const { text, goal } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: "Text is required",
      });
    }

    const result = await improveContent({ text, goal });

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Content Improver Error:", error.message);

    res.status(500).json({
      success: false,
      error: "Failed to improve content",
    });
  }
});

module.exports = router;
