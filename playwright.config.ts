/**
 * @fileoverview Playwright configuration for E2E integration tests
 * @module playwright.config
 */

import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for testing the Prisoner's Dilemma game.
 * Tests run against the Vite dev server for fast feedback.
 */
export default defineConfig({
  testDir: './src/features/game/integration',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Start dev server before tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
