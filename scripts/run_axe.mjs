#!/usr/bin/env node
import fs from "node:fs";
import { createRequire } from "node:module";

// Support comma and whitespace separated lists
const urls = (process.env.AXE_URLS || "")
  .split(/[\s,]+/)
  .map((s) => s.trim())
  .filter((s) => s.length > 0);
if (urls.length === 0) {
  console.error("No AXE_URLS provided");
  process.exit(2);
}
fs.mkdirSync("ci/axe", { recursive: true });

// Use Playwright + axe-core to avoid ChromeDriver version mismatches
const { chromium } = await import("playwright");
const require = createRequire(import.meta.url);

// Prefer on-disk axe.min.js path; fallback to inline source string from module export
let axeScriptPath = null;
let axeInlineSource = null;
try {
  axeScriptPath = require.resolve("axe-core/axe.min.js");
} catch {}
if (!axeScriptPath) {
  try {
    const axeMod = await import("axe-core");
    axeInlineSource = axeMod?.default?.source || axeMod?.source || null;
  } catch {}
}

let failed = false;
const browser = await chromium.launch({ headless: true });
try {
  for (const url of urls) {
    const safe = url.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
    const out = `ci/axe/${safe}.json`;

    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: "networkidle" });
      if (axeScriptPath) {
        await page.addScriptTag({ path: axeScriptPath });
      } else if (axeInlineSource) {
        // Inject the axe source directly
        await page.addScriptTag({ content: axeInlineSource });
      } else {
        throw new Error("axe-core script not found");
      }

      const results = await page.evaluate(async () => {
        // eslint-disable-next-line no-undef
        return await axe.run(document, {
          resultTypes: ["violations"],
          reporter: "v2",
        });
      });
      fs.writeFileSync(out, JSON.stringify(results, null, 2));

      const serious = (results.violations || []).filter((v) =>
        ["serious", "critical"].includes(v.impact),
      );
      if (serious.length > 0) {
        console.error(
          `AXE serious/critical issues on ${url}: ${serious.length}`,
        );
        failed = true;
      } else {
        console.log(`AXE: 0 serious/critical violations on ${url}`);
      }
    } catch (e) {
      console.error(`AXE execution failed for ${url}`);
      console.error(String(e?.message || e));
      failed = true;
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}

if (failed) process.exit(1);
