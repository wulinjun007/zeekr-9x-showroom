import assert from 'node:assert/strict';
import fs from 'node:fs';
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || 'playwright'
);
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
});
const page = await context.newPage();
const errors = [],
  requests = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
try {
  await page.goto(
    process.env.QA_URL ||
      'http://localhost:3001/?mode=day&view=side&wrapTheme=atelier',
    { waitUntil: 'domcontentloaded' },
  );
  await page.waitForFunction(
    () =>
      document.querySelector('canvas') &&
      [...document.querySelectorAll('button')].some(
        (b) => b.getAttribute('aria-label') === '放大' && !b.disabled,
      ),
    { timeout: 60000 },
  );
  const firstAssets = requests
    .filter((r) => r.url.includes('/cdn/'))
    .map((r) => r.url);
  assert.equal(
    firstAssets.filter((u) => u.includes('/materials/')).length,
    0,
    'exterior does not download cabin microtextures',
  );
  assert.equal(
    firstAssets.filter((u) => u.endsWith('.glb')).length,
    2,
    'required model loads once each',
  );
  await page.getByRole('button', { name: '更多选配', exact: true }).click();
  const fixture = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const x = c.getContext('2d');
    x.fillStyle = '#df553a';
    x.beginPath();
    x.arc(256, 256, 220, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = 'white';
    x.font = 'bold 100px sans-serif';
    x.textAlign = 'center';
    x.fillText('LOCAL', 256, 290);
    return c.toDataURL('image/png').split(',')[1];
  });
  await page
    .locator('input[type=file]')
    .setInputFiles({
      name: 'local-test.png',
      mimeType: 'image/png',
      buffer: Buffer.from(fixture, 'base64'),
    });
  await page.waitForSelector('.wrap-upload-preview img');
  await page.waitForFunction(
    () => document.querySelector('.wrap-upload-preview img')?.complete,
  );
  await page
    .getByRole('button', { name: '收起选配', exact: true })
    .first()
    .click();
  await page.screenshot({ path: 'outputs/wrap-upload-qa.png' });
  assert.equal(
    requests.filter((r) => r.method === 'POST').length,
    0,
    'artwork not uploaded to server',
  );
  await page.getByRole('button', { name: '车内空间', exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector('[data-cabin-detail="ready"]'),
    { timeout: 60000 },
  );
  const detailAssets = requests
    .filter((r) => r.url.includes('/cdn/') && r.url.includes('/materials/'))
    .map((r) => r.url);
  assert.ok(detailAssets.some((u) => u.includes('/leather_white/normal.jpg')));
  assert.ok(detailAssets.some((u) => u.includes('/scuba_suede/normal.jpg')));
  assert.equal(errors.length, 0, errors.join('\n').slice(0, 2500));
  const report = { firstAssets, detailAssets, errors, localArtworkSent: false };
  fs.writeFileSync(
    'outputs/loading-browser-report.json',
    JSON.stringify(report, null, 2),
  );
  console.log(
    'PASS: 2 model requests; no exterior microtexture requests; cabin details load on entry; local upload creates no POST; no browser errors.',
  );
} finally {
  await browser.close();
}
