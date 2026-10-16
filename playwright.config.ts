import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', timeout: 45000, workers: 1,
  use: { baseURL: 'http://127.0.0.1:5174', headless: true, hasTouch: true, viewport: { width: 1440, height: 900 }, screenshot: 'only-on-failure' },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5174 --strictPort', url: 'http://127.0.0.1:5174', reuseExistingServer: !process.env.CI }
});
