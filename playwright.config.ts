import { defineConfig } from '@playwright/test'
import { resolveDeployment } from './docs/.vitepress/deployment.mjs'

const { base } = resolveDeployment()
const previewURL = 'http://127.0.0.1:4173' + base

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: previewURL,
    browserName: 'chromium',
    locale: 'zh-CN',
    colorScheme: 'light',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: 'npm run docs:preview -- --port 4173',
    url: previewURL,
    reuseExistingServer: false,
    timeout: 60000,
  },
})
