import { defineConfig, devices } from 'playwright/test';

/**
 * Playwright Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 *
 * Quick Commands:
 * - npm run test:e2e              # Run all tests (chromium, firefox, webkit)
 * - npm run test:quick            # Run only chromium & firefox (faster)
 * - npm run test:e2e:chromium     # Run chromium only
 * - npm run test:e2e:firefox      # Run firefox only
 * - npm run test:e2e:webkit       # Run webkit only (requires system deps)
 * - npm run test:e2e:headed       # Run with browser visible
 * - npm run test:e2e:debug        # Run in debug mode with Playwright Inspector
 * - npm run test:e2e:ui           # Run with Playwright UI mode
 * - npm run test:e2e:report       # View last test report
 * - npm run test:smoke            # Run quick smoke tests only
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['github'],
    ['list']
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:8080',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot only on failures */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'smoke-tests',
      testMatch: '**/smoke.spec.ts',
      use: { ...devices['Desktop Chrome'] },
      retries: 0,
    },
    {
      name: 'chromium',
      testIgnore: /.*\.smoke\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testIgnore: /.*\.smoke\.spec\.ts/,
      use: { ...devices['Desktop Firefox'] },
    },
    // WebKit requires system dependencies on Linux
    // See docs/PLAYWRIGHT_WEBKIT_SETUP.md for setup instructions
    // Uncomment below to enable WebKit testing:
    // {
    //   name: 'webkit',
    //   testIgnore: /.*\.smoke\.spec\.ts/,
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'hugo server --port 8080 --bind 0.0.0.0 --disableFastRender',
    port: 8080,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
