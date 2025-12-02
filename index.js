const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Simple paraphraser function (we will replace with AI later)
function paraphrase(text, mode) {
    switch (mode) {
        case "standard":
            return text.replace(/very/gi, "extremely");

        case "fluency":
            return "In other words, " + text;

        case "creative":
            return "Imagine this: " + text;

        case "shorten":
            return text.split(" ").slice(0, 10).join(" ") + "...";

        case "expand":
            return text + " This means that " + text;

        case "formal":
            return text.replace(/you/gi, "one");

        case "simple":
            return text.replace(/utilize/gi, "use");

        case "humanize":
            return "Honestly, " + text;

        case "grammar-fix":
            return text.replace(/dont/gi, "don't");

        default:
            return text;
    }
}

// -------------------------
// PARAPHRASER API
// -------------------------
app.post('/api/paraphrase', (req, res) => {
    const { text, mode } = req.body;

    if (!text || !mode) {
        return res.status(400).json({
            error: "text and mode are required"
        });
    }

    const output = paraphrase(text, mode);

    res.json({
        input: text,
        mode: mode,
        output: output
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});