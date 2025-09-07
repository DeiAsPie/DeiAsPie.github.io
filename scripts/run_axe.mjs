#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";

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

try {
  execSync("npx -y @axe-core/cli --version", { stdio: "ignore" });
} catch {}

let failed = false;
for (const url of urls) {
  const safe = url.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
  const out = `ci/axe/${safe}.json`;
  try {
    // Run axe and always exit 0; we’ll enforce severity in post-processing
    execSync(
      `npx -y @axe-core/cli ${url} --chromedriver-path= --save ${out}`,
      { stdio: "inherit", shell: "/usr/bin/bash" },
    );
    // Post-process JSON to count impacts
    const data = JSON.parse(fs.readFileSync(out, "utf8"));
    const issues = (data.violations || []).filter((v) =>
      ["serious", "critical"].includes(v.impact),
    );
    if (issues.length > 0) {
      console.error(`AXE serious/critical issues on ${url}: ${issues.length}`);
      failed = true;
    }
  } catch (e) {
    console.error(`AXE execution failed for ${url}`);
    failed = true;
  }
}
if (failed) process.exit(1);
