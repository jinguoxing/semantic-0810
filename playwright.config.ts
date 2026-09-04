import { defineConfig } from '@playwright/test';

const port = process.env.VITE_FIND_DATA_MODE === 'http' ? 4400 : 4399;

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  fullyParallel: false,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: `bunx vite --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 45_000
  }
});
