#!/usr/bin/env node
/**
 * check_image_budgets.js
 * - Analyzes image sizes per content bundle for performance monitoring
 * - Fails if any bundle exceeds configured image budget thresholds
 * - Supports different budgets for different content types
 *
 * Usage:
 *   node scripts/check_image_budgets.js               # enforce budgets
 *   node scripts/check_image_budgets.js --print       # print all bundle sizes
 *   node scripts/check_image_budgets.js --report      # generate detailed report
 *   IMAGE_BUDGET_KIB=500 node scripts/check_image_budgets.js  # override default budget
 *
 * Directory-specific budgets are configured in BUDGET_OVERRIDES below.
 * This allows different content types to have different size limits.
 */
const fs = require("fs");
const path = require("path");

// Configuration
const DEFAULT_BUDGET_KIB = 400; // Default budget per bundle in KiB
const OVERSIZED_THRESHOLD = 1000; // Warn about individual images over this size
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg'];

// Directory-specific budgets (in KiB)
const BUDGET_OVERRIDES = {
  'static/courses': 1200, // Courses have more images, allow higher budget
  'courses': 1200,        // Alternative path mapping
  'static/images': 400,
  'default': 400
};

// Content directories to analyze
const CONTENT_DIRS = [
  'content/recommendations',
  'static/images',
  'static/courses'
];

/**
 * Get file size in KiB
 * @param {string} filePath
 * @returns {number}
 */
function getFileSizeKib(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return stat.size / 1024;
  } catch (error) {
    return 0;
  }
}

/**
 * Check if file is an image based on extension
 * @param {string} filePath
 * @returns {boolean}
 */
function isImageFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}

/**
 * Recursively find all image files in a directory
 * @param {string} dirPath
 * @returns {Array<{path: string, size: number}>}
 */
function findImagesInDirectory(dirPath) {
  const images = [];

  if (!fs.existsSync(dirPath)) {
    return images;
  }

  function walkDirectory(currentPath) {
    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walkDirectory(fullPath);
      } else if (isImageFile(fullPath)) {
        images.push({
          path: fullPath,
          size: getFileSizeKib(fullPath)
        });
      }
    }
  }

  walkDirectory(dirPath);
  return images;
}

/**
 * Group images by bundle (directory)
 * @param {Array} images
 * @returns {Map<string, Array>}
 */
function groupImagesByBundle(images) {
  const bundles = new Map();

  for (const image of images) {
    let bundleName;

    // Group by immediate parent directory for content bundles
    if (image.path.includes('content/recommendations/')) {
      const parts = image.path.split('/');
      const recIndex = parts.findIndex(part => part === 'recommendations');
      bundleName = parts[recIndex + 1] || 'root';
    } else if (image.path.includes('static/')) {
      // Group static images by subdirectory
      const parts = image.path.split('/');
      const staticIndex = parts.findIndex(part => part === 'static');
      bundleName = `static/${parts[staticIndex + 1] || 'root'}`;
    } else {
      bundleName = 'other';
    }

    if (!bundles.has(bundleName)) {
      bundles.set(bundleName, []);
    }
    bundles.get(bundleName).push(image);
  }

  return bundles;
}

/**
 * Get budget for a specific bundle
 * @param {string} bundleName
 * @returns {number}
 */
function getBudgetForBundle(bundleName) {
  // Check for exact match first
  if (BUDGET_OVERRIDES[bundleName]) {
    return BUDGET_OVERRIDES[bundleName];
  }

  // Check for partial match
  for (const [key, value] of Object.entries(BUDGET_OVERRIDES)) {
    if (bundleName.includes(key) || key.includes(bundleName)) {
      return value;
    }
  }

  return BUDGET_OVERRIDES['default'] || DEFAULT_BUDGET_KIB;
}

/**
 * Generate detailed report
 * @param {Map} bundles
 * @param {number} defaultBudget
 */
function generateReport(bundles, defaultBudget) {
  console.log(`\n📊 Image Budget Report\n`);
  console.log("Bundle".padEnd(30) + "Budget".padEnd(12) + "Images".padEnd(8) + "Total".padEnd(12) + "Status");
  console.log("-".repeat(72));

  let totalImages = 0;
  let totalSize = 0;
  let violatingBundles = 0;

  // Sort bundles by total size descending
  const sortedBundles = Array.from(bundles.entries()).sort(
    (a, b) => {
      const aTotalSize = a[1].reduce((sum, img) => sum + img.size, 0);
      const bTotalSize = b[1].reduce((sum, img) => sum + img.size, 0);
      return bTotalSize - aTotalSize;
    }
  );

  for (const [bundleName, images] of sortedBundles) {
    const bundleTotalSize = images.reduce((sum, img) => sum + img.size, 0);
    const bundleBudget = getBudgetForBundle(bundleName);
    const exceeds = bundleTotalSize > bundleBudget;
    const status = exceeds ? "⚠️  OVER" : "✅ OK";

    if (exceeds) violatingBundles++;

    console.log(
      bundleName.padEnd(30) +
      `${bundleBudget.toFixed(0)} KiB`.padEnd(12) +
      images.length.toString().padEnd(8) +
      `${bundleTotalSize.toFixed(1)} KiB`.padEnd(12) +
      status
    );

    totalImages += images.length;
    totalSize += bundleTotalSize;

    // Show oversized individual images
    const oversizedImages = images.filter(img => img.size > OVERSIZED_THRESHOLD);
    if (oversizedImages.length > 0) {
      for (const img of oversizedImages) {
        console.log(`    📸 ${path.basename(img.path)}: ${img.size.toFixed(1)} KiB`);
      }
    }
  }

  console.log("-".repeat(72));
  console.log(`Total: ${totalImages} images, ${totalSize.toFixed(1)} KiB`);
  console.log(`Bundles over budget: ${violatingBundles}/${bundles.size}`);

  if (violatingBundles > 0) {
    console.log("\n💡 Recommendations:");
    console.log("- Consider optimizing images with tools like imagemin or squoosh");
    console.log("- Use WebP/AVIF formats for better compression");
    console.log("- Implement responsive images with srcset");
    console.log("- Move large hero images to separate optimization workflow");
  }
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const isPrint = args.includes('--print');
  const isReport = args.includes('--report');

  // Collect all images
  const allImages = [];
  for (const contentDir of CONTENT_DIRS) {
    const images = findImagesInDirectory(contentDir);
    allImages.push(...images);
  }

  if (allImages.length === 0) {
    console.log("No images found in analyzed directories.");
    process.exit(0);
  }

  // Group by bundles
  const bundles = groupImagesByBundle(allImages);

  // Get budget from environment or use default
  const budgetStr = process.env.IMAGE_BUDGET_KIB;
  const budget = budgetStr ? parseFloat(budgetStr) : DEFAULT_BUDGET_KIB;

  if (isNaN(budget)) {
    console.error(`Invalid IMAGE_BUDGET_KIB '${budgetStr}'.`);
    process.exit(2);
  }

  if (isPrint || isReport) {
    generateReport(bundles, budget);
    process.exit(0);
  }

  // Enforcement mode
  let hasViolations = false;
  const violations = [];

  for (const [bundleName, images] of bundles) {
    const bundleTotalSize = images.reduce((sum, img) => sum + img.size, 0);
    const bundleBudget = getBudgetForBundle(bundleName);

    if (bundleTotalSize > bundleBudget + 0.01) { // Small tolerance for floating point
      hasViolations = true;
      violations.push({
        bundle: bundleName,
        size: bundleTotalSize,
        budget: bundleBudget
      });
    }
  }

  if (hasViolations) {
    console.error(`\n❌ Image budget violations found:\n`);
    for (const violation of violations) {
      console.error(`  ${violation.bundle}: ${violation.size.toFixed(1)} KiB exceeds budget ${violation.budget.toFixed(1)} KiB`);
    }
    console.error(`\nRun 'node scripts/check_image_budgets.js --report' for detailed analysis.`);
    process.exit(1);
  } else {
    console.log(`✅ All ${bundles.size} image bundles within their respective budgets.`);
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = { findImagesInDirectory, groupImagesByBundle, getFileSizeKib, getBudgetForBundle };
