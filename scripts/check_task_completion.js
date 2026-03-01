#!/usr/bin/env node
/**
 * check_task_completion.js
 * - Audits implementation status of features and bug fixes
 * - Parses docs/plans/ and docs/brainstorms/ for Markdown checkboxes
 * - Verifies that "completed" plans have all tasks checked off
 *
 * Usage:
 *   node scripts/check_task_completion.js                # audit all plans
 *   node scripts/check_task_completion.js --report       # detailed report
 */
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

// Configuration
const AUDIT_DIRS = ["docs/plans", "docs/brainstorms"];

/**
 * Get all markdown files to audit
 * @returns {string[]}
 */
function getFilesToAudit() {
  const files = [];

  for (const dir of AUDIT_DIRS) {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) continue;

    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      if (item.endsWith(".md")) {
        files.push(path.join(dir, item));
      }
    }
  }

  return files;
}

/**
 * Extract checkboxes from content
 * @param {string} content
 * @returns {Object}
 */
function extractCheckboxes(content) {
  const lines = content.split("\n");
  let total = 0;
  let completed = 0;
  const unchecked = [];

  // Sections we care about most
  const targetSections = ["Acceptance Criteria", "Phases", "Functional Requirements", "Tasks"];
  let inTargetSection = false;
  let currentSection = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const sectionMatch = line.match(/^#{1,6}\s+(.+)$/);

    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      inTargetSection = targetSections.some(s => currentSection.toLowerCase().includes(s.toLowerCase()));
    }

    // Match checkboxes: - [ ] or - [x]
    const checkboxMatch = line.match(/^\s*-\s*\[([ xX])\]\s*(.+)$/);
    if (checkboxMatch) {
      const isChecked = checkboxMatch[1].toLowerCase() === "x";
      const taskText = checkboxMatch[2].trim();

      total++;
      if (isChecked) {
        completed++;
      } else {
        unchecked.push({ text: taskText, line: i + 1, section: currentSection });
      }
    }
  }

  return { total, completed, unchecked };
}

/**
 * Audit a single file
 * @param {string} filePath
 * @returns {Object}
 */
function auditFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  const rawContent = fs.readFileSync(fullPath, "utf8");
  const parsed = matter(rawContent);
  
  const status = parsed.data.status || "active";
  const { total, completed, unchecked } = extractCheckboxes(parsed.content);
  
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isConsistent = (status === "completed" && total > 0) ? (completed === total) : true;

  return {
    filePath,
    title: parsed.data.title || path.basename(filePath),
    status,
    total,
    completed,
    percent,
    unchecked,
    isConsistent
  };
}

/**
 * Generate report
 * @param {Object[]} results
 */
function generateReport(results) {
  console.log(`
📋 Task Completion Audit Report
`);
  
  const totalFiles = results.length;
  const inconsistent = results.filter(r => !r.isConsistent);
  
  console.log(`Files audited: ${totalFiles}`);
  console.log(`Inconsistent states: ${inconsistent.length}
`);

  // Group by status
  const grouped = results.reduce((acc, r) => {
    if (!acc[r.status]) acc[r.status] = [];
    acc[r.status].push(r);
    return acc;
  }, {});

  for (const [status, files] of Object.entries(grouped)) {
    console.log(`--- Status: ${status.toUpperCase()} ---`);
    files.sort((a, b) => b.percent - a.percent).forEach(f => {
      const icon = f.isConsistent ? "✅" : "❌";
      console.log(`${icon} [${f.percent}%] ${f.title}`);
      if (!f.isConsistent) {
        console.log(`   ⚠️  Marked as "completed" but has ${f.total - f.completed} unchecked tasks:`);
        f.unchecked.forEach(u => {
          console.log(`      - (line ${u.line}) ${u.text}`);
        });
      } else if (f.status === "active" && f.percent > 0 && f.percent < 100) {
        // Just a hint for progress
        // console.log(`   (Progress: ${f.completed}/${f.total} tasks)`);
      }
    });
    console.log("");
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const isReport = args.includes("--report") || args.length === 0;

  const files = getFilesToAudit();
  if (files.length === 0) {
    console.log("No plans or brainstorms found to audit.");
    process.exit(0);
  }

  const results = files.map(auditFile);

  if (isReport) {
    generateReport(results);
  }

  const hasErrors = results.some(r => !r.isConsistent);

  if (hasErrors) {
    console.error("❌ Audit failed: Some files marked as 'completed' have unchecked tasks.");
    process.exit(1);
  }

  console.log("✅ All 'completed' plans are fully checked off.");
  process.exit(0);
}

if (require.main === module) {
  main();
}
