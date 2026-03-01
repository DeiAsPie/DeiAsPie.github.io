import { test, expect } from '@playwright/test';

/**
 * Smoke tests for critical functionality
 * These tests run quickly and catch major regressions
 * @see https://playwright.dev/docs/writing-tests
 */

test.describe('Critical User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    // Set up viewport for consistent testing
    await page.setViewportSize({ width: 1200, height: 800 });
  });

  test('homepage loads and displays key content', async ({ page }) => {
    await page.goto('/');

    // Check core page elements
    await expect(page).toHaveTitle(/DeiAsPie - Privacy & Security Recommendations/);
    await expect(page.locator('h1')).toBeVisible();

    // Check navigation exists and has proper links
    const mainNav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(mainNav).toBeVisible();
    await expect(mainNav.getByRole('link', { name: 'All' })).toBeVisible(); // Link to all recommendations
    await expect(mainNav.getByRole('link', { name: 'About' })).toBeVisible();
  });

  test('theme toggle works correctly', async ({ page }) => {
    await page.goto('/');

    // Find theme toggle button (prefer id selector for reliability)
    const themeToggle = page.locator('#theme-toggle');
    await expect(themeToggle).toBeVisible();

    // Get initial theme state
    const initialHtmlClass = await page.locator('html').getAttribute('class');
    const initialTheme = await page.evaluate(() => localStorage.getItem('theme'));

    // Toggle theme
    await themeToggle.click();

    // Verify theme changed
    await page.waitForTimeout(100); // Brief wait for theme transition
    const newHtmlClass = await page.locator('html').getAttribute('class');
    const newTheme = await page.evaluate(() => localStorage.getItem('theme'));

    // Check that either class or localStorage changed
    const classChanged = initialHtmlClass !== newHtmlClass;
    const storageChanged = initialTheme !== newTheme;

    expect(classChanged || storageChanged).toBeTruthy();

    // Verify dark mode class toggling if using class-based theme
    if (initialHtmlClass?.includes('dark') || newHtmlClass?.includes('dark')) {
      expect(initialHtmlClass !== newHtmlClass).toBeTruthy();
    }
  });

  test('recommendations page displays content cards', async ({ page }) => {
    await page.goto('/recommendations/');

    await expect(page).toHaveTitle(/Recommendations/);

    // Check for recommendation cards
    const cards = page.locator('.card, [class*="card"], article, .recommendation-item');
    await expect(cards.first()).toBeVisible();

    // Check that cards have expected content
    const firstCard = cards.first();
    await expect(firstCard.locator('h2, h3, .card-title, [class*="title"]')).toBeVisible();
  });

  test('individual recommendation page loads', async ({ page }) => {
    await page.goto('/recommendations/');

    // Find and click first recommendation card link
    const firstRecommendationLink = page.locator('.card > a.block').first();
    await expect(firstRecommendationLink).toBeVisible();

    await firstRecommendationLink.click();

    // Wait for navigation
    await page.waitForLoadState('networkidle');

    // Check we're on a recommendation page
    expect(page.url()).toMatch(/\/recommendations\/[^\/]+\/?$/);

    // Check basic page structure
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('navigation is accessible via keyboard', async ({ page }) => {
    await page.goto('/');

    // Start with focus on body
    await page.locator('body').click();

    // Tab to navigation elements
    await page.keyboard.press('Tab');

    // Check focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Check focus ring or outline is present (accessibility requirement)
    const focusedElementStyles = await focusedElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
      };
    });

    // Should have either outline or box-shadow (focus ring)
    const hasFocusIndicator =
      focusedElementStyles.outline !== 'none' ||
      focusedElementStyles.outlineWidth !== '0px' ||
      focusedElementStyles.boxShadow !== 'none';

    expect(hasFocusIndicator).toBeTruthy();
  });
});

test.describe('Mobile Responsiveness', () => {
  test('mobile navigation works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Look for mobile menu button (prefer id selector for reliability)
    const mobileMenuButton = page.locator('#mobile-menu-toggle');

    // Only test if mobile menu exists
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();

      // Check if menu opens (use #mobile-menu and aria-label)
      const mobileMenu = page.locator('#mobile-menu');
      await expect(mobileMenu).toBeVisible();

      // Check navigation links are accessible
      const navLinks = mobileMenu.locator('a');
      await expect(navLinks.first()).toBeVisible();
    }
  });

  test('responsive images load correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/recommendations/');

    // Check that images are present and have loaded
    const images = page.locator('img');
    const firstImage = images.first();

    if (await firstImage.isVisible()) {
      // Wait for image to load
      await expect(firstImage).toBeVisible();

      // Check image has appropriate attributes for responsive design
      const srcset = await firstImage.getAttribute('srcset');
      const sizes = await firstImage.getAttribute('sizes');
      const loading = await firstImage.getAttribute('loading');

      // At least one responsive attribute should be present
      const hasResponsiveAttributes = srcset || sizes || loading === 'lazy';
      expect(hasResponsiveAttributes).toBeTruthy();
    }
  });
});

test.describe('Performance & Accessibility', () => {
  test('no console errors on critical pages', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Visit key pages
    await page.goto('/');
    await page.goto('/recommendations/');
    await page.goto('/about/');

    // Filter out known non-critical errors
    const criticalErrors = consoleErrors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('manifest') &&
      !error.includes('service-worker') &&
      !error.toLowerCase().includes('third-party') &&
      !error.includes("Content Security Policy directive 'frame-ancestors' is ignored") &&
      !error.includes('InvalidStateError')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('pages have proper meta tags', async ({ page }) => {
    await page.goto('/');

    // Check essential meta tags
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content');

    const metaViewport = page.locator('meta[name="viewport"]');
    await expect(metaViewport).toHaveAttribute('content');

    // Check page has proper title
    await expect(page).toHaveTitle(/.+/); // Non-empty title
  });

  test('LQIP placeholders render on recommendation pages', async ({ page }) => {
    await page.goto('/recommendations/');
    const lqipWrap = page.locator('.lqip-wrap');
    
    // Ensure at least one exists to avoid false positives
    await expect(lqipWrap.first()).toBeVisible(); 
    await expect(lqipWrap.first().locator('img.lqip-img')).toBeVisible();
    
    const bgImage = await lqipWrap.first().evaluate(
      el => getComputedStyle(el).backgroundImage
    );
    expect(bgImage).toContain('data:image/webp;base64,');
  });
});
