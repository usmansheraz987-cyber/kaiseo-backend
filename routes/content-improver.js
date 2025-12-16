import express from "express";
import { improveContent } from "../utils/contentImprover.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { text, goal } = req.body;

  if (!text || !goal) {
    return res.status(400).json({
      success: false,
      error: "Text and goal are required"
    });
  }

  try {
    const improved = await improveContent({ text, goal });

    res.json({
      success: true,
      result: improved
    });
  } catch {
    res.status(500).json({
      success: false,
      error: "Failed to improve content"
    });
  }
});

export default router;
