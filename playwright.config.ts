import { defineConfig, devices } from '@playwright/test';

const fakeMediaArgs = [
  '--use-fake-ui-for-media-stream',
  '--use-fake-device-for-media-stream',
];

export default defineConfig({
  testDir: './tests/playwright',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  outputDir: 'test-results',
  use: {
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 15_000,
    navigationTimeout: 90_000,
  },
  projects: [
    {
      name: 'ci',
      testMatch: '**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
        launchOptions: { args: fakeMediaArgs },
      },
    },
    {
      name: 'local',
      testMatch: '**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        headless: false,
      },
    },
  ],
});
