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


app.use("/api/paraphrase", paraphraseRoute);
app.use("/api/keyword-density", keywordDensityRoute);
app.use("/api/seo-analyze", require('./routes/seo-analyzer'));
app.use("/api/ai-detect", aiDetector);



// health check
app.get("/", (req, res) => res.send({ ok: true }));

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

