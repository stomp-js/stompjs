import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './spec/unit',
  workers: 1,
  timeout: 30000,
  reporter: 'list',
  projects: [
    { name: 'node' },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
