import { expect, test } from '@playwright/test'
import { players } from '../src/data'
import type { Page } from '@playwright/test'

async function pair(page: Page) {
  const names = await page.locator('.arena .player-info h2').allTextContents()
  return names.map(name => players.find(p => p.name === name)!)
}

test('selection, scoring, player carry-over, loss, restart, and persistent highscore', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '프리미어리그', exact: false }).click()
  await page.getByRole('button', { name: '어려움', exact: true }).click()
  await page.getByRole('button', { name: '게임 시작하기' }).click()
  await expect(page.locator('.game-heading')).toContainText('프리미어리그 · 어려움')
  let [left, right] = await pair(page)
  const rightName = right.name
  await expect(page.locator('.arena .right .player-value strong')).toHaveText('?')
  const correct = right.value > left.value ? '더 높다' : right.value < left.value ? '더 낮다' : '같다'
  await page.getByRole('button', { name: correct, exact: true }).click()
  await expect(page.locator('.current-score strong')).toHaveText('01')
  await expect(page.locator('.question')).toContainText('정답이에요')
  await expect(page.getByRole('status')).toHaveText('다음 선수를 준비하고 있어요')
  await expect(page.getByRole('button', { name: '더 높다', exact: true })).toBeDisabled()
  await expect(page.locator('.arena .left h2')).toHaveText(rightName)
  await expect(page.getByRole('button', { name: '더 높다', exact: true })).toBeEnabled()
  await expect(page.getByRole('status')).toHaveCount(0)
  ;[left, right] = await pair(page)
  const incorrect = right.value >= left.value ? '더 낮다' : '더 높다'
  await page.getByRole('button', { name: incorrect, exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('결과를 준비하고 있어요')
  await expect(page.locator('.result-number strong')).toHaveText('1')
  await page.getByRole('button', { name: '다시 도전하기' }).click()
  await expect(page.locator('.current-score strong')).toHaveText('00')
  await expect(page.locator('.best-score strong')).toHaveText('1')
  await page.getByRole('button', { name: '게임 나가기' }).click()
  await page.getByRole('button', { name: '무대 선택으로', exact: true }).click()
  await page.reload()
  await page.getByRole('button', { name: '내 최고기록', exact: false }).click()
  await expect(page.locator('.records-table > div').filter({ hasText: '프리미어리그' })).toContainText('1')
  await expect(page.locator('.recent-list')).toContainText('1점')
})

test('help dialog, keyboard control, and exit cancellation', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '게임 방법', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: '게임 시작하기' }).click()
  const [left, right] = await pair(page)
  await page.keyboard.press(right.value >= left.value ? 'ArrowUp' : 'ArrowDown')
  await expect(page.locator('.current-score strong')).toHaveText('01')
  await page.getByRole('button', { name: '게임 나가기' }).click()
  await page.getByRole('button', { name: '계속 대결하기' }).click()
  await expect(page.locator('.arena')).toBeVisible()
})

test('corrupt or blocked local storage does not stop playing', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('wmv-ko.records.tm-20261029', '{broken json'))
  await page.goto('/')
  await expect(page.getByRole('button', { name: '게임 시작하기' })).toBeVisible()
  await page.evaluate(() => {
    Object.defineProperty(Storage.prototype, 'setItem', { value: () => { throw new DOMException('blocked') } })
  })
  await page.getByRole('button', { name: '어려움', exact: true }).click()
  await page.getByRole('button', { name: '게임 시작하기' }).click()
  const [left, right] = await pair(page)
  await page.getByRole('button', { name: right.value >= left.value ? '더 낮다' : '더 높다', exact: true }).click()
  await expect(page.locator('.storage-warning')).toBeVisible()
  await page.getByRole('button', { name: '다시 도전하기' }).click()
  await expect(page.locator('.arena')).toBeVisible()
})

for (const width of [360, 390, 768, 1440]) {
  test(`responsive layout and readable text at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 1000 })
    await page.goto('/')
    await expect(page.locator('.edition-card')).toHaveCount(6)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: `artifacts/home-${width}.png`, fullPage: true })
    await page.getByRole('button', { name: '게임 시작하기' }).click()
    await expect(page.locator('.arena .player-card')).toHaveCount(2)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const smallText = await page.locator('body *').evaluateAll(nodes => nodes.filter(el => {
      if (!el.textContent?.trim() || el.children.length || el.closest('svg') || !el.getClientRects().length) return false
      return Number.parseFloat(getComputedStyle(el).fontSize) <= 11
    }).map(el => el.className))
    expect(smallText).toEqual([])
    await page.screenshot({ path: `artifacts/game-${width}.png`, fullPage: true })
  })
}

test('easy excludes equal values and hard offers equality', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '게임 시작하기' }).click()
  const [left,right] = await pair(page)
  expect(left.value).not.toBe(right.value)
  await page.goto('/')
  await page.getByRole('button', { name: '어려움', exact: true }).click()
  await page.getByRole('button', { name: '게임 시작하기' }).click()
  await expect(page.getByRole('button', { name: '같다', exact: true })).toBeVisible()
})

test('player cards show photos and fall back when image loading fails', async ({ page }) => {
  await page.route('https://img.a.transfermarkt.technology/**', async route => {
    if (route.request().url().includes('yamal-mbappe')) {
      await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="red"/></svg>' })
    } else await route.abort()
  })
  await page.goto('/')
  const left = page.locator('.hero-preview .player-card.left')
  const right = page.locator('.hero-preview .player-card.right')
  await expect(left.locator('img.player-photo.loaded')).toBeVisible()
  await expect(left.locator('svg.jersey')).toHaveCount(0)
  await expect(right.locator('img.player-photo')).toHaveCount(0)
  await expect(right.locator('svg.jersey')).toBeVisible()
  await page.getByRole('button', { name: '게임 시작하기' }).click()
  await expect(page.locator('.arena .jersey')).toHaveCount(2)
})

test('local league logos load without an external connection', async ({ page }) => {
  await page.route('https://tmsi.akamaized.net/**', route => route.abort())
  await page.goto('/')
  const logos = page.locator('.official-mark img')
  await expect(logos).toHaveCount(4)
  await expect.poll(() => logos.evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true)
  await expect(page.locator('.custom-mark svg')).toHaveCount(2)
  await expect(page.getByRole('button', { name: '챔피언십', exact: false })).toHaveCount(0)
})

test('league logos have a visible fallback and custom emblems remain available', async ({ page }) => {
  await page.route('**/src/assets/leagues/*.png', route => route.abort())
  await page.goto('/')
  await expect(page.locator('.official-mark svg')).toHaveCount(4)
  await expect(page.locator('.custom-mark svg')).toHaveCount(2)
  await expect(page.getByRole('button', { name: '챔피언십', exact: false })).toHaveCount(0)
})
