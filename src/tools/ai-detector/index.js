// tools/ai-detector/index.js

const controller = require("./controller");

module.exports = {
  detectAI: controller.detect,
  compareAI: controller.compare,
  analyzeInsights: controller.insights
};
