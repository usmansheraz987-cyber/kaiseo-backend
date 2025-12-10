const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "250kb" }));

// Routes
const paraphraseRoute = require("./routes/paraphrase");
const keywordDensityRoute = require("./routes/keyword-density.js");
const aiDetector = require("./routes/ai-detector");
const readabilityRoute = require("./routes/readability");
const plagiarismRoute = require("./routes/plagiarism");
const internalLinksRoute = require("./routes/internal-links.js");



app.use("/api/paraphrase", paraphraseRoute);
app.use("/api/keyword-density", keywordDensityRoute);
app.use("/api/seo-analyze", require('./routes/seo-analyzer'));
app.use("/api/ai-detect", aiDetector);
app.use("/api/readability", readabilityRoute);
app.use("/api/plagiarism", plagiarismRoute);
app.use("/api/internal-links", internalLinksRoute);


// health check
app.get("/", (req, res) => res.send({ ok: true }));

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});


