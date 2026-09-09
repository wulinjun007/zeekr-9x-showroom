const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || 'playwright'
);
import fs from 'node:fs';
import assert from 'node:assert/strict';
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
});
const errors = [],
  models = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('request', (r) => {
  if (r.url().endsWith('.glb')) models.push(r.url());
});
fs.mkdirSync('outputs/n90', { recursive: true });
await page.goto(
  (process.env.QA_URL || 'http://localhost:3001/') + '?vehicle=n90&orbit=false',
);
const ready = async (view) =>
  page.waitForFunction(
    (v) => document.querySelector('.n90-stage')?.dataset.viewReady === v,
    view,
    { timeout: 60000 },
  );
await ready('hero');
await page.screenshot({ path: 'outputs/n90/website-night.png' });
await page.getByRole('button', { name: '左后门 打开', exact: true }).click();
await page.waitForFunction(
  () => document.querySelector('.n90-stage')?.dataset.motionReady === 'true',
  null,
  { timeout: 30000 },
);
await page.screenshot({ path: 'outputs/n90/website-door.png' });
await page.getByRole('button', { name: '左后门 关闭', exact: true }).click();
await page.getByRole('button', { name: '内饰', exact: true }).click();
await ready('driver');
await page.screenshot({ path: 'outputs/n90/website-interior.png' });
await page.getByRole('button', { name: '砂陶米', exact: true }).click();
await page.getByRole('button', { name: '模型说明' }).click();
assert(await page.getByRole('dialog').isVisible());
await page.keyboard.press('Escape');
assert(!(await page.getByRole('dialog').isVisible()));
await page.getByRole('button', { name: '空间', exact: true }).click();
await page.getByRole('button', { name: /对坐会客/ }).click();
await ready('top');
await page.waitForFunction(
  () => document.querySelector('.n90-stage')?.dataset.motionReady === 'true',
  null,
  { timeout: 30000 },
);
await page.screenshot({ path: 'outputs/n90/website-space.png' });
await page.setViewportSize({ width: 390, height: 844 });
await page.getByRole('button', { name: '全景', exact: true }).click();
await ready('hero');
await page.screenshot({
  path: 'outputs/n90/website-mobile.png',
  fullPage: true,
});
assert(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
assert(!models.some((x) => x.includes('zeekr')));
await page.getByLabel('切换车型').click();
await page.getByRole('link', { name: /ZEEKR 9X/ }).click();
await page.waitForURL('**vehicle=zeekr');
await page.waitForFunction(
  () =>
    document.querySelector('canvas') &&
    [...document.querySelectorAll('button')].some(
      (b) => b.getAttribute('aria-label') === '放大' && !b.disabled,
    ),
  null,
  { timeout: 60000 },
);
fs.writeFileSync(
  'outputs/n90/browser-validation.json',
  JSON.stringify(
    {
      errors,
      models,
      mobileNoOverflow: true,
      dialogEscape: true,
      vehicleNavigation: true,
    },
    null,
    2,
  ),
);
console.log({ errors, models });
await browser.close();
