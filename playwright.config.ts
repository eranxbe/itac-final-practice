import { defineConfig, devices, type ReporterDescription } from '@playwright/test';

const { loadRunConfig } = require('./scripts/load-config');

type RunConfig = {
  env: string;
  suite: string;
  type: string;
  baseURL: string;
  apiBaseURL: string;
  timeout: number;
  retries: number;
  workers: number | null;
  browsers: string[];
  trace: 'on' | 'off' | 'retain-on-failure' | 'on-first-retry';
  screenshot: 'on' | 'off' | 'only-on-failure';
  video: 'on' | 'off' | 'retain-on-failure';
  headed: boolean;
};

const DEVICE_MAP: Record<string, (typeof devices)[string]> = {
  chromium: devices['Desktop Chrome'],
  firefox: devices['Desktop Firefox'],
  webkit: devices['Desktop Safari'],
};

const runConfig = loadRunConfig() as RunConfig;

const reporters: ReporterDescription[] = [
  ['list'],
  ['html', {
    outputFolder: 'playwright-report',
    open: 'never',
  }],
];

const uiProjects = (runConfig.browsers || []).map((browser) => {
  const device = DEVICE_MAP[browser];
  if (!device) {
    throw new Error(`Unknown browser in config: ${browser}`);
  }
  return {
    name: `ui-${browser}`,
    testDir: './tests/ui',
    use: {
      ...device,
      baseURL: runConfig.baseURL,
      headless: !runConfig.headed,
    },
  };
});

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: runConfig.retries ?? 0,
  workers: runConfig.workers ?? undefined,
  timeout: runConfig.timeout,
  reporter: reporters,
  use: {
    trace: runConfig.trace,
    screenshot: runConfig.screenshot,
    video: runConfig.video,
  },
  projects: [
    ...uiProjects,
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: runConfig.apiBaseURL,
        screenshot: 'off',
        video: 'off',
      },
    },
  ],
});
