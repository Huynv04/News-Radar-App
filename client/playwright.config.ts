import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config cho News Radar App E2E tests.
 * Docs: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },

  // Chạy tests tuần tự (không parallel) để tránh conflict dữ liệu
  fullyParallel: false,
  workers: 1,

  // Retry 1 lần nếu fail (CI environment)
  retries: process.env.CI ? 1 : 0,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
    // Chụp screenshot khi test fail
    screenshot: 'only-on-failure',
    // Ghi video khi fail
    video: 'retain-on-failure',
    // Trace để debug
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment để test trên nhiều browser
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],

  // Tự động khởi động dev server trước khi chạy E2E
  webServer: [
    {
      command: 'pnpm run dev',
      url: 'http://localhost:5173',
      cwd: '.', // thư mục client
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
});

