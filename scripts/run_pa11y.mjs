#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";

const urls = (process.env.PA11Y_URLS || "").split(",").filter(Boolean);
if (urls.length === 0) {
  console.error("No PA11Y_URLS provided");
  process.exit(2);
}
fs.mkdirSync("ci/pa11y", { recursive: true });

for (const url of urls) {
  const safe = url.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
  const out = `ci/pa11y/${safe}.json`;
  try {
    execSync(`npx -y pa11y --reporter json ${url} > ${out}`, {
      stdio: "inherit",
      shell: "/usr/bin/bash",
    });
  } catch (e) {
    // pa11y exits non-zero on issues; fail the job by rethrowing
    throw e;
  }
}
