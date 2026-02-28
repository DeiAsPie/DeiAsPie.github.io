#!/usr/bin/env node
/**
 * check_content_quality.js
 * - Lints markdown and HTML content for common issues
 * - Checks heading hierarchies, missing alt text, broken internal links
 * - Validates front matter and content structure
 *
 * Usage:
 *   node scripts/check_content_quality.js                # lint all content
 *   node scripts/check_content_quality.js --report       # detailed report
 *   node scripts/check_content_quality.js --fix          # auto-fix issues where possible
 */
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

// Configuration
const CONTENT_DIRS = [
  'content',
  'layouts'
];

const REQUIRED_FRONTMATTER = [
  'title',
  'date'
];

const HEADING_PATTERN = /^(#{1,6})\s+(.+)$/gm;
const IMAGE_PATTERN = /<img[^>]*>/gi;
const LINK_PATTERN = /\[([^\]]*)\]\(([^)]+)\)/g;
const EMPTY_LINK_PATTERN = /\[\]\(([^)]*)\)/g;
const HTML_LINK_PATTERN = /<a[^>]*href=["']([^"']*)["'][^>]*>/gi;
const LOREM_IPSUM_PATTERN = /lorem ipsum/gi;

/**
 * Check if file should be linted
 * @param {string} filePath
 * @returns {boolean}
 */
function shouldLintFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ['.md', '.html'].includes(ext);
}

/**
 * Get all files to lint
 * @param {string} dirPath
 * @returns {string[]}
 */
function getFilesToLint(dirPath) {
  const files = [];

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (!fs.existsSync(dirPath)) {
    return files;
  }

  function walkDirectory(currentPath) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walkDirectory(fullPath);
      } else if (shouldLintFile(fullPath)) {
        files.push(fullPath);
      }
    }
  }

  walkDirectory(dirPath);
  return files;
}

/**
 * Parse markdown file with front matter
 * @param {string} filePath
 * @returns {Object}
 */
function parseMarkdownFile(filePath) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const content = fs.readFileSync(filePath, 'utf8');
  const isMarkdown = path.extname(filePath) === '.md';

  if (isMarkdown) {
    try {
      const parsed = matter(content);
      return {
        frontMatter: parsed.data,
        content: parsed.content,
        raw: content
      };
    } catch (error) {
      return {
        frontMatter: {},
        content: content,
        raw: content,
        parseError: error.message
      };
    }
  }

  return {
    frontMatter: {},
    content: content,
    raw: content
  };
}

/**
 * Check heading hierarchy
 * @param {string} content
 * @returns {Object[]}
 */
function checkHeadingHierarchy(content) {
  const issues = [];
  const headings = [];
  let match;

  // Reset regex
  HEADING_PATTERN.lastIndex = 0;

  while ((match = HEADING_PATTERN.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const line = content.substring(0, match.index).split('\n').length;

    headings.push({ level, text, line });
  }

  if (headings.length === 0) {
    issues.push({
      type: 'heading',
      severity: 'warning',
      message: 'No headings found in content'
    });
    return issues;
  }

  // Check for multiple H1s
  const h1Count = headings.filter(h => h.level === 1).length;
  if (h1Count > 1) {
    issues.push({
      type: 'heading',
      severity: 'error',
      message: `Multiple H1 headings found (${h1Count}). Should have only one H1 per page.`
    });
  }

  if (h1Count === 0) {
    issues.push({
      type: 'heading',
      severity: 'warning',
      message: 'No H1 heading found. Each page should have exactly one H1.'
    });
  }

  // Check heading level progression
  for (let i = 1; i < headings.length; i++) {
    const current = headings[i]; // eslint-disable-line security/detect-object-injection
    const previous = headings[i - 1];

    if (current.level > previous.level + 1) {
      issues.push({
        type: 'heading',
        severity: 'warning',
        message: `Heading level jump from H${previous.level} to H${current.level} at line ${current.line}. Consider using H${previous.level + 1} instead.`,
        line: current.line
      });
    }
  }

  return issues;
}

/**
 * Check for missing alt text, loading, and decoding in images
 * @param {string} content
 * @returns {Object[]}
 */
function checkImageAttributes(content) {
  const issues = [];
  let match;

  // Reset regex
  IMAGE_PATTERN.lastIndex = 0;

  while ((match = IMAGE_PATTERN.exec(content)) !== null) {
    const imgTag = match[0];
    const line = content.substring(0, match.index).split('\n').length;

    // Check if alt attribute exists and is not empty
    const altMatch = imgTag.match(/alt=["']([^"']*)["']/i);

    if (!altMatch) {
      issues.push({
        type: 'accessibility',
        severity: 'error',
        message: 'Image missing alt attribute',
        line: line,
        context: imgTag.substring(0, 50) + '...'
      });
    } else if (altMatch[1].trim() === '') {
      issues.push({
        type: 'accessibility',
        severity: 'warning',
        message: 'Image has empty alt attribute. Use descriptive text or alt="" for decorative images.',
        line: line,
        context: imgTag.substring(0, 50) + '...'
      });
    }

    // Check for loading="lazy"
    if (!imgTag.match(/loading=["']lazy["']/i)) {
      issues.push({
        type: 'performance',
        severity: 'warning',
        message: 'Image missing loading="lazy" attribute',
        line: line,
        context: imgTag.substring(0, 50) + '...'
      });
    }

    // Check for decoding="async"
    if (!imgTag.match(/decoding=["']async["']/i)) {
      issues.push({
        type: 'performance',
        severity: 'warning',
        message: 'Image missing decoding="async" attribute',
        line: line,
        context: imgTag.substring(0, 50) + '...'
      });
    }
  }

  return issues;
}

/**
 * Check for empty links or placeholder text
 * @param {string} content
 * @returns {Object[]}
 */
function checkEmptyLinks(content) {
  const issues = [];
  let match;

  // Reset regex
  EMPTY_LINK_PATTERN.lastIndex = 0;

  while ((match = EMPTY_LINK_PATTERN.exec(content)) !== null) {
    const line = content.substring(0, match.index).split('\n').length;
    issues.push({
      type: 'content',
      severity: 'error',
      message: 'Empty markdown link []() found',
      line: line,
      context: match[0]
    });
  }

  // Check for empty HTML links
  HTML_LINK_PATTERN.lastIndex = 0;
  while ((match = HTML_LINK_PATTERN.exec(content)) !== null) {
    const line = content.substring(0, match.index).split('\n').length;
    const url = match[1];
    if (url === '' || url === '#') {
      issues.push({
        type: 'content',
        severity: 'warning',
        message: `Empty or placeholder HTML link found: ${url}`,
        line: line,
        context: match[0].substring(0, 50) + '...'
      });
    }
  }

  return issues;
}

/**
 * Check for lorem ipsum placeholder text
 * @param {string} content
 * @returns {Object[]}
 */
function checkLoremIpsum(content) {
  const issues = [];
  let match;

  LOREM_IPSUM_PATTERN.lastIndex = 0;
  while ((match = LOREM_IPSUM_PATTERN.exec(content)) !== null) {
    const line = content.substring(0, match.index).split('\n').length;
    issues.push({
      type: 'content',
      severity: 'warning',
      message: 'Lorem ipsum placeholder text found',
      line: line,
      context: '... ' + content.substring(match.index - 10, match.index + 20) + ' ...'
    });
  }

  return issues;
}

/**
 * Check for broken internal links
 * @param {string} content
 * @param {string} filePath
 * @returns {Object[]}
 */
function checkInternalLinks(content, filePath) {
  const issues = [];
  const baseDir = path.dirname(filePath);

  // Check markdown links
  let match;
  LINK_PATTERN.lastIndex = 0;

  while ((match = LINK_PATTERN.exec(content)) !== null) {
    const linkText = match[1];
    const linkUrl = match[2];
    const line = content.substring(0, match.index).split('\n').length;

    if (isInternalLink(linkUrl)) {
      const resolvedPath = resolveInternalLink(linkUrl, baseDir);
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (resolvedPath && !fs.existsSync(resolvedPath)) {
        issues.push({
          type: 'link',
          severity: 'error',
          message: `Broken internal link: ${linkUrl}`,
          line: line,
          context: `[${linkText}](${linkUrl})`
        });
      }
    }
  }

  // Check HTML links
  HTML_LINK_PATTERN.lastIndex = 0;

  while ((match = HTML_LINK_PATTERN.exec(content)) !== null) {
    const linkUrl = match[1];
    const line = content.substring(0, match.index).split('\n').length;

    if (isInternalLink(linkUrl)) {
      const resolvedPath = resolveInternalLink(linkUrl, baseDir);
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (resolvedPath && !fs.existsSync(resolvedPath)) {
        issues.push({
          type: 'link',
          severity: 'error',
          message: `Broken internal HTML link: ${linkUrl}`,
          line: line,
          context: match[0].substring(0, 50) + '...'
        });
      }
    }
  }

  return issues;
}

/**
 * Check if URL is internal
 * @param {string} url
 * @returns {boolean}
 */
function isInternalLink(url) {
  // Skip Hugo template variables
  if (url.includes('{{') || url.includes('}}')) {
    return false;
  }
  return !url.startsWith('http') && !url.startsWith('mailto:') && !url.startsWith('#');
}

/**
 * Resolve internal link to file path
 * @param {string} url
 * @param {string} baseDir
 * @returns {string|null}
 */
function resolveInternalLink(url, baseDir) {
  try {
    // Remove query params and fragments
    const cleanUrl = url.split('?')[0].split('#')[0];

    if (cleanUrl.startsWith('/')) {
      // Absolute path from project root
      return path.join(process.cwd(), 'content', cleanUrl.substring(1));
    } else {
      // Relative path
      return path.resolve(baseDir, cleanUrl);
    }
  } catch (error) {
    return null;
  }
}

/**
 * Check front matter
 * @param {Object} frontMatter
 * @returns {Object[]}
 */
function checkFrontMatter(frontMatter) {
  const issues = [];

  for (const required of REQUIRED_FRONTMATTER) {
    // eslint-disable-next-line security/detect-object-injection
    if (!frontMatter[required]) {
      issues.push({
        type: 'frontmatter',
        severity: 'error',
        message: `Missing required front matter field: ${required}`
      });
    }
  }

  // Check date format
  if (frontMatter.date) {
    const date = new Date(frontMatter.date);
    if (isNaN(date.getTime())) {
      issues.push({
        type: 'frontmatter',
        severity: 'error',
        message: 'Invalid date format in front matter'
      });
    }
  }

  return issues;
}

/**
 * Lint a single file
 * @param {string} filePath
 * @returns {Object}
 */
function lintFile(filePath) {
  const parsed = parseMarkdownFile(filePath);
  const issues = [];

  if (parsed.parseError) {
    issues.push({
      type: 'syntax',
      severity: 'error',
      message: `Parse error: ${parsed.parseError}`
    });
  }

  // Check front matter (only for markdown files)
  if (path.extname(filePath) === '.md') {
    issues.push(...checkFrontMatter(parsed.frontMatter));
  }

  // Check content
  const isLayout = filePath.includes('layouts/');

  if (!isLayout) {
    issues.push(...checkHeadingHierarchy(parsed.content));
    issues.push(...checkImageAttributes(parsed.content));
    issues.push(...checkLoremIpsum(parsed.content));
  }
  
  issues.push(...checkInternalLinks(parsed.content, filePath));
  issues.push(...checkEmptyLinks(parsed.content));

  return {
    filePath,
    issues,
    stats: {
      totalIssues: issues.length,
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length
    }
  };
}

/**
 * Generate report
 * @param {Object[]} results
 */
function generateReport(results) {
  const totalFiles = results.length;
  const filesWithIssues = results.filter(r => r.issues.length > 0).length;
  const totalIssues = results.reduce((sum, r) => sum + r.stats.totalIssues, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.stats.errors, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.stats.warnings, 0);

  console.log(`\n📝 Content Quality Report\n`);
  console.log(`Files analyzed: ${totalFiles}`);
  console.log(`Files with issues: ${filesWithIssues}`);
  console.log(`Total issues: ${totalIssues} (${totalErrors} errors, ${totalWarnings} warnings)\n`);

  if (totalIssues === 0) {
    console.log('✅ No issues found!');
    return;
  }

  // Group issues by type
  const issuesByType = {};

  for (const result of results) {
    if (result.issues.length === 0) continue;

    console.log(`📄 ${result.filePath}`);

    for (const issue of result.issues) {
      const prefix = issue.severity === 'error' ? '❌' : '⚠️ ';
      const location = issue.line ? ` (line ${issue.line})` : '';
      console.log(`  ${prefix} ${issue.message}${location}`);

      if (issue.context) {
        console.log(`     Context: ${issue.context}`);
      }

      // Track by type
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = 0;
      }
      issuesByType[issue.type]++;
    }
    console.log('');
  }

  console.log('📊 Issue Summary:');
  for (const [type, count] of Object.entries(issuesByType)) {
    console.log(`  ${type}: ${count}`);
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const isReport = args.includes('--report') || args.length === 0;
  const isFix = args.includes('--fix');

  console.log('🔍 Scanning content files...');

  const allFiles = [];
  for (const dir of CONTENT_DIRS) {
    const files = getFilesToLint(dir);
    allFiles.push(...files);
  }

  if (allFiles.length === 0) {
    console.log('No content files found to lint.');
    process.exit(0);
  }

  console.log(`Found ${allFiles.length} files to analyze.`);

  const results = allFiles.map(lintFile);

  if (isReport) {
    generateReport(results);
  }

  const hasErrors = results.some(r => r.stats.errors > 0);

  if (hasErrors && !isReport) {
    console.error('❌ Content linting found errors.');
    process.exit(1);
  }

  if (isFix) {
    console.log('\n🔧 Auto-fix is not yet implemented.');
    console.log('Consider using markdownlint-cli2 --fix for markdown files.');
  }

  process.exit(hasErrors ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = { lintFile, checkHeadingHierarchy, checkImageAttributes, checkInternalLinks, checkEmptyLinks, checkLoremIpsum };
