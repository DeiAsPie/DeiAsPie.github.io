#!/usr/bin/env node
/**
 * check_css_size.js
 * - Computes size of assets/gen/tailwind.css in KiB
 * - Reads committed baseline from css-baseline-kib.txt
 * - Computes budget as baseline × 1.15 (or uses explicit CSS_BUDGET_KIB)
 * - Fails if size exceeds budget
 *
 * The baseline is updated deliberately when CSS legitimately grows, in the same
 * commit as the CSS change that caused the growth. A baseline bump without a
 * corresponding CSS change is a signal that something is wrong.
 *
 * Usage:
 *   node scripts/check_css_size.js           # enforce against baseline × 1.15
 *   node scripts/check_css_size.js --print   # print size in KiB
 *   node scripts/check_css_size.js --print --bytes # print raw bytes
 *
 * Environment:
 *   CSS_BUDGET_KIB — explicit budget override (optional); if set, used instead of baseline × 1.15
 *   CSS_FILE — override path to CSS file (default: assets/gen/tailwind.css)
 *   CSS_BASELINE_FILE — override path to baseline file (default: css-baseline-kib.txt)
 */
const fs = require("node:fs");
const path = require("node:path");

const cssPath =
  process.env.CSS_FILE ||
  path.resolve(__dirname, "..", "assets", "gen", "tailwind.css");
const baselinePath =
  process.env.CSS_BASELINE_FILE ||
  path.resolve(__dirname, "..", "css-baseline-kib.txt");

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
    process.stdout.write(`${kib.toFixed(1)} KiB`);
  }
  process.exit(0);
}

// Determine budget: explicit env override, baseline × 1.15, or fail
let budget;
const budgetStr = process.env.CSS_BUDGET_KIB;
if (budgetStr) {
  budget = parseFloat(budgetStr);
  if (Number.isNaN(budget)) {
    console.error(`Invalid CSS_BUDGET_KIB '${budgetStr}'.`);
    process.exit(2);
  }
} else if (fs.existsSync(baselinePath)) {
  const baseline = parseFloat(fs.readFileSync(baselinePath, "utf-8").trim());
  if (Number.isNaN(baseline) || baseline < 0) {
    console.error(
      `Malformed baseline in ${baselinePath}: must be a non-negative number.`,
    );
    process.exit(2);
  }
  budget = baseline * 1.15;
} else {
  console.error(
    `Baseline file not found: ${baselinePath}.\n` +
      `Regenerate it from the current build:\n` +
      `  npm run build:css && node scripts/check_css_size.js --print > css-baseline-kib.txt`,
  );
  process.exit(2);
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
