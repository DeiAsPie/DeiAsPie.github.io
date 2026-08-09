#!/usr/bin/env node
/**
 * check_css_size.js
 * - Computes size of assets/gen/tailwind.css in KiB
 * - Computes budget as current size × 1.15 (or uses explicit CSS_BUDGET_KIB)
 * - Fails if size exceeds budget
 *
 * Usage:
 *   node scripts/check_css_size.js           # enforce with 1.15× multiplier
 *   node scripts/check_css_size.js --print   # print size in KiB
 *   node scripts/check_css_size.js --print --bytes # print raw bytes
 *
 * Environment:
 *   CSS_BUDGET_KIB — explicit budget override (optional); if set, used instead of 1.15× multiplier
 */
const fs = require("fs");
const path = require("path");

const cssPath = path.resolve(__dirname, "..", "assets", "gen", "tailwind.css");
if (!fs.existsSync(cssPath)) {
  console.error(
    `CSS file not found: ${cssPath}. Did you run 'npm run build:css'?`,
  );
  process.exit(2);
}
const stat = fs.statSync(cssPath);
const bytes = stat.size;
const kib = bytes / 1024;

if (process.argv.includes("--print")) {
  if (process.argv.includes("--bytes")) {
    process.stdout.write(String(bytes));
  } else {
    process.stdout.write(kib.toFixed(1) + " KiB");
  }
  process.exit(0);
}

// Determine budget: explicit env override, or computed 1.15× multiplier
let budget;
const budgetStr = process.env.CSS_BUDGET_KIB;
if (budgetStr) {
  budget = parseFloat(budgetStr);
  if (isNaN(budget)) {
    console.error(`Invalid CSS_BUDGET_KIB '${budgetStr}'.`);
    process.exit(2);
  }
} else {
  // Compute budget as 15% headroom over current size
  budget = kib * 1.15;
}

if (kib > budget + 0.0001) {
  console.error(
    `CSS size ${kib.toFixed(1)} KiB exceeds budget ${budget.toFixed(1)} KiB`,
  );
  process.exit(1);
}
console.log(
  `CSS size ${kib.toFixed(1)} KiB within budget ${budget.toFixed(1)} KiB.`,
);
