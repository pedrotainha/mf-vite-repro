import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for smoke tests — NO webServers.
 *
 * Servers must be started separately before running this config.
 * The baseURL is controlled via E2E_HOST_URL env var (full URL).
 * See ADR-011 for usage examples.
 */

const HOST_URL = process.env.E2E_HOST_URL ?? 'http://localhost:4173';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'smoke-*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: HOST_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
