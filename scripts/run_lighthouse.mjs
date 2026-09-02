#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";

const urls = (process.env.LH_URLS || "").split(",").filter(Boolean);
if (urls.length === 0) {
  console.error("No LH_URLS provided");
  process.exit(2);
}

// Ensure output dir exists
fs.mkdirSync("ci/lighthouse", { recursive: true });

// Honor CHROME_PATH if already set by caller; otherwise attempt one install
let chromePath = process.env.CHROME_PATH;
if (!chromePath) {
  try {
    execSync("npx -y playwright install chromium", { stdio: "inherit" });
    // Resolve the installed chromium executable path
    try {
      const { chromium } = await import("playwright");
      chromePath = chromium.executablePath();
    } catch (_e) {
      console.error("Failed to resolve Playwright Chromium executable path");
    }
  } catch (_e) {
    console.error("Failed to install Playwright Chromium");
  }
}
const env = { ...process.env };
if (chromePath) {
  env.CHROME_PATH = chromePath;
  env.LHCI_CHROME_PATH = chromePath;
  env.LHCI_COLLECT_CHROME_PATH = chromePath;
  env.LHCI_COLLECT_SETTINGS_CHROME_PATH = chromePath;
  env.LIGHTHOUSE_CHROMIUM_PATH = chromePath;
  env.CHROME_BIN = chromePath;
  console.error(`[lhci] Using Chrome at: ${chromePath}`);
}

// Write a temporary config that injects chromePath for collect.settings
let cfgPath = "ci/lighthouserc.json";
if (chromePath) {
  try {
    const raw = fs.readFileSync("ci/lighthouserc.json", "utf8");
    const cfg = JSON.parse(raw);
    cfg.ci = cfg.ci || {};
    cfg.ci.collect = cfg.ci.collect || {};
    cfg.ci.collect.settings = cfg.ci.collect.settings || {};
    cfg.ci.collect.settings.chromePath = chromePath;
    // --no-sandbox is required wherever unprivileged user namespaces are
    // disabled (Ubuntu 23.10+ under AppArmor, most containers, GitHub's
    // runner images). Without it Chrome aborts with "No usable sandbox!"
    // before the debugging port ever opens.
    // Launcher flags live on collect, not collect.settings: lhci only forwards
    // ci.collect.chromeFlags (a space-separated string) to ChromeLauncher.
    cfg.ci.collect.chromeFlags = "--headless=new --no-sandbox";
    fs.mkdirSync("ci", { recursive: true });
    fs.writeFileSync(
      "ci/lighthouserc.with.chrome.json",
      JSON.stringify(cfg, null, 2),
    );
    cfgPath = "ci/lighthouserc.with.chrome.json";
  } catch (_e) {
    // fallback to original cfgPath
  }
}

try {
  execSync(`npx -y @lhci/cli collect --config=${cfgPath}`, {
    stdio: "inherit",
    env,
  });
  execSync(`npx -y @lhci/cli assert --config=${cfgPath}`, {
    stdio: "inherit",
    env,
  });
} catch (_e) {
  console.error("Lighthouse CI failed");
  process.exit(1);
}
