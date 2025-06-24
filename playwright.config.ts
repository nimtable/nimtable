import { defineConfig, devices } from "@playwright/test"

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  /* Global setup and teardown for Testcontainers */
  globalSetup: require.resolve("./e2e/global-setup"),
  globalTeardown: require.resolve("./e2e/global-teardown"),
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Use single worker to avoid auth conflicts with nimtable backend */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["html"],
    ["json", { outputFile: "test-results/results.json" }],
    process.env.CI ? ["github"] : ["list"],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || "http://localhost:3000",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Take screenshot on failure */
    screenshot: "only-on-failure",

    /* Record video on failure */
    video: "retain-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    // {
    //   command: 'pnpm run build && pnpm run start',
    //   url: 'http://localhost:3000',
    //   reuseExistingServer: !process.env.CI,
    //   timeout: 120 * 1000, // 2 minutes
    // },
    // Uncomment if you want to start backend automatically
    // {
    //   command: 'cd backend && ./gradlew run',
    //   url: 'http://localhost:8182',
    //   reuseExistingServer: !process.env.CI,
    //   timeout: 180 * 1000, // 3 minutes
    // }
  ],
})
