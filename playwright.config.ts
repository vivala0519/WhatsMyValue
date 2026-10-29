import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './e2e',
  outputDir: 'artifacts/playwright',
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL: 'http://127.0.0.1:5174',
    launchOptions: { executablePath: process.env.BROWSER_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:5174', reuseExistingServer: !process.env.CI },
})
