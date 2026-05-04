import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './spec/unit',
  workers: 1,
  timeout: 30000,
  reporter: 'list',
});
