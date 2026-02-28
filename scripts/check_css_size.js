#!/usr/bin/env node
/**
 * check_css_size.js
 * - Monitors CSS file size and enforces budgets
 *
 * Usage:
 *   node scripts/check_css_size.js
 *   CSS_BUDGET_KIB=50 node scripts/check_css_size.js
 */
const fs = require("fs");
const path = require("path");

const CSS_PATH = './assets/gen/tailwind.css';
const DEFAULT_BUDGET_KIB = 100;

function main() {
  if (!fs.existsSync(CSS_PATH)) {
    console.error(`❌ CSS file not found: ${CSS_PATH}`);
    console.error(`Run 'npm run build:css' first.`);
    process.exit(1);
  }

  const stats = fs.statSync(CSS_PATH);
  const sizeKib = stats.size / 1024;
  const budgetKib = process.env.CSS_BUDGET_KIB ? parseFloat(process.env.CSS_BUDGET_KIB) : DEFAULT_BUDGET_KIB;

  console.log(`🎨 CSS Size: ${sizeKib.toFixed(1)} KiB (Budget: ${budgetKib.toFixed(1)} KiB)`);

  if (sizeKib > budgetKib) {
    console.error(`❌ CSS size exceeds budget!`);
    process.exit(1);
  } else {
    console.log(`✅ CSS size is within budget.`);
  }
}

if (require.main === module) {
  main();
}
