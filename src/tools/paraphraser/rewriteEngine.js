const { generateText } = require("../../../utils/aiClient");

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

module.exports = async function rewrite({ prompt, temperatureRange }) {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("Invalid prompt passed to rewrite engine");
  }

  const temperature = randomBetween(
    temperatureRange[0],
    temperatureRange[1]
  );

  return generateText(prompt, {
    temperature
  });
};
