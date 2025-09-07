#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const urls = (process.env.LH_URLS || "").split(",").filter(Boolean);
if (urls.length === 0) {
  console.error("No LH_URLS provided");
  process.exit(2);
}

// Ensure output dir exists
fs.mkdirSync("ci/lighthouse", { recursive: true });

function findPlaywrightChromium() {
  try {
    const base = path.join(process.cwd(), "node_modules", "playwright", ".local-browsers");
    if (!fs.existsSync(base)) return null;
    const entries = fs.readdirSync(base, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory() || !e.name.startsWith("chromium-")) continue;
      const candLinux = path.join(base, e.name, "chrome-linux", "chrome");
      if (fs.existsSync(candLinux)) return candLinux;
      const candMac = path.join(base, e.name, "chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium");
      if (fs.existsSync(candMac)) return candMac;
      const candWin = path.join(base, e.name, "chrome-win", "chrome.exe");
      if (fs.existsSync(candWin)) return candWin;
    }
  } catch {}
  return null;
}

function ensureChromiumAvailable() {
  let ok = false;
  try {
    execSync("npx -y @lhci/cli healthcheck", { stdio: "ignore" });
    ok = true;
  } catch {
    ok = false;
  }
  if (ok) return undefined;
  // Attempt to install Playwright Chromium and use it
  try {
    execSync("npx -y playwright install chromium", { stdio: "inherit" });
  } catch (e) {
    console.error("Failed to install Playwright Chromium");
  }
  // Try multiple strategies to locate Chromium
  let chromePath = findPlaywrightChromium();
  if (!chromePath) {
    // Look into Playwright cache: ~/.cache/ms-playwright/chromium-*/chrome-linux/chrome
    try {
      const home = process.env.HOME || process.env.USERPROFILE || ".";
      const cacheBase = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(home, ".cache", "ms-playwright");
      if (fs.existsSync(cacheBase)) {
        const entries = fs.readdirSync(cacheBase, { withFileTypes: true });
        for (const e of entries) {
          if (!e.isDirectory() || !e.name.startsWith("chromium-")) continue;
          const p = path.join(cacheBase, e.name, "chrome-linux", "chrome");
          if (fs.existsSync(p)) { chromePath = p; break; }
        }
      }
    } catch {}
  }
  if (!chromePath) {
    // Fallback to common system Chrome/Chromium paths
    const candidates = [
      "/usr/bin/google-chrome-stable",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
    ];
    for (const c of candidates) {
      try { if (fs.existsSync(c)) { chromePath = c; break; } } catch {}
    }
  }
  if (!chromePath) {
    console.error("Chrome not found and Playwright Chromium not available.");
    console.error("Please install Google Chrome/Chromium or run: npx -y playwright install chromium");
    process.exit(1);
  }
  return chromePath;
}

let chromePath = ensureChromiumAvailable();
if (!chromePath) {
  // Fallback explicit path for Playwright cache on Linux
  try {
    const home = process.env.HOME || process.env.USERPROFILE || ".";
    const p = path.join(home, ".cache", "ms-playwright");
    if (fs.existsSync(p)) {
      const entries = fs.readdirSync(p).filter((n) => n.startsWith("chromium-"));
      entries.sort();
      const last = entries[entries.length - 1];
      const bin = path.join(p, last, "chrome-linux", "chrome");
      if (fs.existsSync(bin)) chromePath = bin;
    }
  } catch {}
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
    cfg.ci.collect.settings.chromeFlags = ["--headless=new"]; // modern headless
    fs.mkdirSync("ci", { recursive: true });
    fs.writeFileSync("ci/lighthouserc.with.chrome.json", JSON.stringify(cfg, null, 2));
    cfgPath = "ci/lighthouserc.with.chrome.json";
  } catch (e) {
    // fallback to original cfgPath
  }
}

try {
  execSync(`npx -y @lhci/cli collect --config=${cfgPath}`, { stdio: "inherit", env });
  execSync(`npx -y @lhci/cli assert --config=${cfgPath}`, { stdio: "inherit", env });
} catch (e) {
  console.error("Lighthouse CI failed");
  process.exit(1);
}
