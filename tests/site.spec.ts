import { test, expect, type Page } from '@playwright/test'

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true)
}

test('home demo, keyboard controls and getting started', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('./')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('从一条请求开始')
  await page.getByRole('tab', { name: 'JavaScript', exact: true }).click()
  await expect(page.getByRole('tabpanel')).toContainText('"ok": true')
  await page.getByRole('tab', { name: 'JavaScript', exact: true }).press('Home')
  await expect(page.getByRole('tab', { name: 'MITM', exact: true })).toHaveAttribute('aria-selected', 'true')
  await noOverflow(page)
  await page.screenshot({ path: info.outputPath('home-light.png'), fullPage: true })
  await page.locator('.hero-actions').getByRole('link', { name: /开始使用/ }).click()
  await expect(page).toHaveURL(/\/B-box-docs\/guide\/quick-start\.html$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('跑通第一条请求')
  expect(errors).toEqual([])
})

test('Chinese search and script API search', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: '搜索文档', exact: true }).click()
  const input = page.locator('#localsearch-input')
  await input.fill('证书')
  await expect(page.locator('.VPLocalSearchBox a.result').first()).toBeVisible()
  await page.locator('.VPLocalSearchBox a.result').first().click()
  await expect(page.locator('.vp-doc')).toBeVisible()
  await expect(page).toHaveURL(/\/B-box-docs\/.+\.html/)
  await page.getByRole('button', { name: '搜索文档', exact: true }).click()
  await input.fill('$httpClient')
  await expect(page.locator('.VPLocalSearchBox a.result').first()).toBeVisible()
  await input.press('Escape')
  await expect(input).not.toBeVisible()
})

test('deep links, sidebar and mobile directory', async ({ page, isMobile }, info) => {
  await page.goto('scripts/api.html#定时器')
  await expect(page.locator('#定时器')).toBeInViewport()
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('脚本 API')
  await noOverflow(page)
  await page.screenshot({ path: info.outputPath('script-api.png'), fullPage: true })
  if (isMobile) await page.getByRole('button', { name: '文档目录', exact: true }).click()
  await page.locator('.VPSidebar').getByRole('link', { name: '生成与安装证书', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('生成与安装证书')
  if (isMobile) await expect(page.locator('.VPSidebar')).not.toHaveClass(/open/)
})

test('copyable JSON and downloadable examples', async ({ page, context, request }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('guide/quick-start.html')
  const code = page.locator('.vp-doc .language-json').first()
  await code.hover()
  await code.locator('button.copy').click()
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('"http_rewrite"')
  const copied = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()))
  expect(copied.experimental.http_rewrite.map_local[0].status).toBe(200)
  for (const name of ['http-lab', 'mitm', 'rewrite', 'http-scripts', 'cron-cache']) {
    const response = await request.get(`examples/${name}.json`)
    expect(response.ok()).toBe(true)
    expect(await response.json()).toHaveProperty('experimental')
  }
})

test('dark theme and narrow screens', async ({ page, isMobile }, info) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await page.goto('./')
  await expect(page.locator('html')).toHaveClass(/dark/)
  await noOverflow(page)
  await page.screenshot({ path: info.outputPath('home-dark.png'), fullPage: true })
  if (isMobile) {
    await page.setViewportSize({ width: 320, height: 740 })
    await noOverflow(page)
    await page.goto('reference/limits.html')
    await noOverflow(page)
    await page.screenshot({ path: info.outputPath('narrow-reference.png'), fullPage: true })
  }
})
