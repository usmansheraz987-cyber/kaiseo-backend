module.exports = {
  human: {
    description: "Natural, casual, mixed rhythm",
    temperatureRange: [0.8, 1.1]
  },

  "anti-ai": {
    description: "Break AI patterns aggressively",
    temperatureRange: [0.95, 1.25]
  },

  shorten: {
    description: "Reduce length without losing meaning",
    temperatureRange: [0.6, 0.8],
    targetReduction: 0.3
  }
};
