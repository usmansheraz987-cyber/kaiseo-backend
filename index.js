const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const paraphraseRoute = require("./routes/paraphrase");
const keywordDensityRoute = require("./routes/keywordDensity");

app.use("/api/paraphrase", paraphraseRoute);
app.use("/api/keyword-density", keywordDensityRoute);

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

