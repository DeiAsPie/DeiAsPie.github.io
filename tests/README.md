# Testing Guide

## Running Playwright E2E Tests

### Quick Start

```bash
# Run all tests (chromium + firefox)
npm run test:e2e

# Run quick tests (chromium + firefox, excludes webkit)
npm run test:quick

# Run smoke tests only (fast validation)
npm run test:smoke
```

### Browser-Specific Tests

```bash
# Run tests in specific browsers
npm run test:e2e:chromium   # Chromium/Chrome only
npm run test:e2e:firefox    # Firefox only
npm run test:e2e:webkit     # WebKit/Safari (requires setup - see below)
```

### Interactive & Debug Modes

```bash
# Run with browser visible (headed mode)
npm run test:e2e:headed

# Debug mode with Playwright Inspector
npm run test:e2e:debug

# UI mode for interactive test exploration
npm run test:e2e:ui

# View last test report
npm run test:e2e:report
```

### Advanced Options

You can pass additional Playwright CLI options to any test command:

```bash
# Run specific test file
npm run test:e2e -- tests/e2e/smoke.spec.ts

# Run tests matching pattern
npm run test:e2e -- --grep "homepage"

# Run with verbose output
npm run test:e2e -- --reporter=list

# Run in headed mode for specific browser
npm run test:e2e:firefox -- --headed

# Update snapshots
npm run test:e2e -- --update-snapshots
```

## Test Structure

```
tests/
├── e2e/
│   └── smoke.spec.ts      # Smoke tests for critical user journeys
├── __pycache__/           # Python test cache
└── test_forbidden_templates.py  # Python template tests
```

## Test Coverage

### E2E Tests (Playwright)
- ✅ Critical user journeys
  - Homepage loads and displays key content
  - Navigation works correctly
  - Theme toggle (light/dark/auto)
- ✅ Recommendations functionality
  - Recommendations page displays content
  - Individual recommendation pages load
- ✅ Mobile responsiveness
  - Mobile navigation works
  - Responsive images load correctly
- ✅ Accessibility
  - Keyboard navigation
- ✅ Performance & Quality
  - No console errors on critical pages
  - Proper meta tags and SEO

### Python Tests (pytest)
- Template validation
- Hugo template forbidden patterns

## WebKit Testing Setup

WebKit browser requires additional system dependencies on Linux. See the detailed setup guide:

📄 **[docs/PLAYWRIGHT_WEBKIT_SETUP.md](../docs/PLAYWRIGHT_WEBKIT_SETUP.md)**

To enable WebKit testing:
1. Install dependencies (see guide)
2. Uncomment the webkit project in `playwright.config.ts`
3. Run: `npm run test:e2e:webkit`

## CI/CD Integration

Tests run automatically in GitHub Actions on:
- Pull requests
- Pushes to main branch

CI runs:
- Chromium tests
- Firefox tests
- WebKit tests (in Docker environment)

## Troubleshooting

### Hugo server won't start
```bash
# Check if port 8080 is in use
lsof -i :8080

# Kill existing process
kill -9 <PID>
```

### Tests are flaky
```bash
# Run with retries
npm run test:e2e -- --retries=3

# Run serially (no parallel)
npm run test:e2e -- --workers=1
```

### WebKit dependency errors
See [PLAYWRIGHT_WEBKIT_SETUP.md](../docs/PLAYWRIGHT_WEBKIT_SETUP.md) for:
- Missing library installation
- Docker-based testing alternative
- Skip WebKit option

### View test artifacts
```bash
# Screenshots and traces are saved in test-results/
ls -la test-results/

# View trace files
npx playwright show-trace test-results/<test-name>/trace.zip
```

## Writing New Tests

### Best Practices

1. **Use semantic selectors**
   ```typescript
   // ✅ Good - semantic, robust
   page.getByRole('navigation', { name: 'Main navigation' })
   page.getByRole('button', { name: 'Theme toggle' })

   // ❌ Avoid - fragile
   page.locator('nav')
   page.locator('#some-id')
   ```

2. **Scope selectors properly**
   ```typescript
   // ✅ Good - scoped to component
   const mainNav = page.getByRole('navigation', { name: 'Main navigation' });
   await expect(mainNav.getByRole('link', { name: 'About' })).toBeVisible();

   // ❌ Avoid - ambiguous global selector
   await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
   ```

3. **Test user journeys, not implementation**
   ```typescript
   // ✅ Good - tests behavior
   test('user can toggle theme', async ({ page }) => {
     await page.goto('/');
     await page.getByRole('button', { name: /theme/i }).click();
     // Verify theme changed (visually or via class)
   });

   // ❌ Avoid - tests implementation details
   test('theme toggle changes data attribute', async ({ page }) => {
     // Too coupled to implementation
   });
   ```

4. **Handle browser differences**
   ```typescript
   // Filter out known browser-specific console warnings
   const criticalErrors = consoleErrors.filter(error =>
     !error.includes('Content Security Policy') &&
     !error.includes('blocked an inline style')
   );
   ```

### Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Arrange
    await page.goto('/');

    // Act
    await page.getByRole('button', { name: 'Click me' }).click();

    // Assert
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Writing Accessible Selectors](https://playwright.dev/docs/locators#locate-by-role)
