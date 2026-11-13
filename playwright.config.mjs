// End-to-end tests: Chromium only, against site/ served by tests/serve.mjs under the production CSP.
// Locally a pre-installed Chromium can be used with PW_CHROMIUM_PATH=/path/to/chrome;
// CI runs `npx playwright install --with-deps chromium` instead.
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT) || 4173;
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  // Cold browser starts on a busy machine can take a while; a single test should never need this long.
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: executablePath ? { executablePath } : {} } },
  ],
  webServer: {
    command: 'node tests/serve.mjs',
    env: { PORT: String(PORT) },
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
});
