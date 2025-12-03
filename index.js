const express = require("express");
const cors = require("cors");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// PARAPHRASER ROUTE (your original simple version)
// ----------------------------------------------------
app.post("/api/paraphrase", (req, res) => {
  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: "Text is required" });
  }

  // SIMPLE placeholder logic (we will replace with AI later)
  const output = text;

  res.json({
    input: text,
    output,
  });
});

// ----------------------------------------------------
// KEYWORD DENSITY ROUTE
// ----------------------------------------------------
const keywordDensityRoute = require("./routes/keyword-density.js");
app.use("/api/keyword-density", keywordDensityRoute);

// ----------------------------------------------------
// START SERVER
// ----------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
