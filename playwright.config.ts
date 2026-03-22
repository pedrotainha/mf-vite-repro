import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4173',
  },
  webServer: [
    {
      command: 'pnpm run build:packages && cd apps/host && npx vite --port 4173',
      port: 4173,
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'cd apps/remote && npx vite --port 4174',
      port: 4174,
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
});
