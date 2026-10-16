import { test, expect } from '@playwright/test';
test('campaign controls, tutorial, inventory and save survive reload', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('#battle-objective')).toContainText('Defeat');
  await expect(page.locator('#combat-action-status')).toContainText('Move');
  await page.locator('#btn-help').click();
  await expect(page.locator('#help-dialog')).toBeVisible();
  await page.locator('#btn-close-help').click();
  await page.locator('#tab-inventory').click();
  await expect(page.locator('#inventory-container')).toContainText('Arza');
  await page.locator('#tab-worldmap').click();
  await expect(page.locator('#btn-rest')).toBeVisible();
  await page.locator('#btn-save').click();
  await expect(page.locator('#save-status')).toContainText('Saved');
  await page.reload();
  await expect(page.locator('#header-gold')).toContainText('1,250');
  expect(errors).toEqual([]);
});
test('keyboard ends exactly one unit turn and mobile controls fit', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#hero-name-text')).toHaveText('Arza');
  await page.keyboard.press('Space');
  await expect(page.locator('#hero-name-text')).toHaveText('Lyria');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#btn-end-turn')).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const box = await page.locator('#combat-canvas').evaluate((c: HTMLCanvasElement) => ({w:c.width,h:c.height,cw:c.clientWidth,ch:c.clientHeight}));
  expect(box.w).toBe(box.cw); expect(box.h).toBe(box.ch);
});

test('retreat, recover, travel by touch and restart a different region', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.locator('#btn-abandon').click();
  await page.locator('#btn-rest').click();
  const box = await page.locator('#world-map-canvas').evaluate((c: HTMLCanvasElement) => ({w:c.width,h:c.height,cw:c.clientWidth,ch:c.clientHeight}));
  expect(box.w).toBe(box.cw); expect(box.h).toBe(box.ch);
  await page.locator('#world-map-canvas').tap({position:{x:box.cw*.48,y:box.ch*.26}});
  await expect(page.locator('#map-node-title')).toHaveText('Eldertree Forest');
  await expect(page.locator('#btn-map-action')).toBeEnabled();
  await page.locator('#btn-map-action').click();
  await expect(page.locator('#battle-title')).toHaveText('Eldertree Ambush');
  await expect(page.locator('#btn-end-turn')).toBeEnabled();
});

test('intermediate desktop viewport allows travel to Frostpeak without inspector occlusion', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 900 });
  await page.goto('/');
  await page.locator('#btn-abandon').click();
  const box = await page.locator('#world-map-canvas').evaluate((c: HTMLCanvasElement) => ({ cw: c.clientWidth, ch: c.clientHeight }));
  await page.locator('#world-map-canvas').click({ position: { x: box.cw * 0.48, y: box.ch * 0.26 } });
  await expect(page.locator('#map-node-title')).toHaveText('Eldertree Forest');
  await expect(page.locator('#world-map-canvas')).toHaveAttribute('data-traveling', 'false');
  await page.locator('#world-map-canvas').click({ position: { x: box.cw * 0.22, y: box.ch * 0.20 } });
  await expect(page.locator('#map-node-title')).toHaveText('Frostpeak Citadel');
  await expect(page.locator('#btn-map-action')).toBeEnabled();
});
