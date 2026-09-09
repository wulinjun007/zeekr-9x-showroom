const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || 'playwright'
);
import assert from 'node:assert/strict';
import fs from 'node:fs';
const b = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
});
const context = await b.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'no-preference',
});
const p = await context.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
const url = new URL(process.env.QA_URL || 'http://localhost:3001/');
url.search = '?vehicle=zeekr&configuration=1&mode=day&view=rear&orbit=false';
fs.mkdirSync('outputs', { recursive: true });
const ready = () =>
  p.waitForFunction(
    () =>
      document.querySelector('button[aria-label="放大"]')?.disabled === false,
    null,
    { timeout: 90000 },
  );
try {
  await p.goto(url.href);
  await p.locator('.entrance-overlay').waitFor({ timeout: 90000 });
  assert.equal(
    await p.evaluate(() => localStorage.getItem('zeekr9x-entrance-seen-v1')),
    '1',
  );
  await p.locator('.entrance-skip').click();
  await p.locator('.entrance-overlay').waitFor({ state: 'detached' });
  await ready();
  await p.reload();
  await ready();
  assert.equal(await p.locator('.entrance-overlay').count(), 0);
  assert(await p.locator('.tour-replay').isVisible());
  await p.screenshot({ path: 'outputs/entrance-replay-desktop.png' });
  await p.locator('.tour-replay').click();
  await p.locator('.entrance-overlay').waitFor();
  assert(
    await p
      .locator('.entrance-skip')
      .evaluate((e) => e === document.activeElement),
  );
  await p.keyboard.press('Escape');
  await p.locator('.entrance-overlay').waitFor({ state: 'detached' });
  assert(
    await p
      .locator('.tour-replay')
      .evaluate((e) => e === document.activeElement),
  );
  assert.equal(new URL(p.url()).searchParams.get('mode'), 'day');
  assert.equal(
    await p.locator('.scene-tabs button.active').innerText(),
    '白天',
  );
  assert.equal(
    await p.locator('.view-presets button.active').first().innerText(),
    '车尾',
  );
  await p.setViewportSize({ width: 390, height: 844 });
  await p.screenshot({ path: 'outputs/entrance-replay-mobile.png' });
  assert(await p.locator('.tour-replay').isVisible());
  await p.locator('.tour-replay').click();
  await p.locator('.entrance-overlay').waitFor();
  await p.locator('.entrance-skip').click();
  await p.locator('.entrance-overlay').waitFor({ state: 'detached' });
  await p.reload();
  await ready();
  assert.equal(await p.locator('.entrance-overlay').count(), 0);
  assert.deepEqual(errors, []);
  const result = {
    firstVisitAutoplay: true,
    reloadSkipped: true,
    manualReplay: true,
    mobileReplay: true,
    focusReturned: true,
    configurationPreserved: true,
    errors,
  };
  fs.writeFileSync(
    'outputs/entrance-replay-qa.json',
    JSON.stringify(result, null, 2),
  );
  console.log(result);
} finally {
  await b.close();
}
