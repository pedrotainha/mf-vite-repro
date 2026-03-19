import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @-label-/fleet dev',
      port: 4174,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter @-label-/rentals dev',
      port: 4175,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter @-label-/maintenance dev',
      port: 4176,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter @-label-/host dev',
      port: 4173,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
