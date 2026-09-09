const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || 'playwright'
);
import assert from 'node:assert/strict';
import fs from 'node:fs';
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
fs.mkdirSync('outputs', { recursive: true });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.addInitScript(() => {
  window.__audio = [];
  const Native = window.AudioContext;
  window.AudioContext = class extends Native {
    constructor(...args) {
      super(...args);
      const ctx = this,
        item = { ctx, noteStarts: 0, analyser: null };
      window.__audio.push(item);
      const nativeResume = this.resume.bind(this);
      let metered = false;
      this.resume = async () => {
        await nativeResume();
        if (metered) return;
        metered = true;
        const source =
          "class Meter extends AudioWorkletProcessor { constructor(){super();this.peak=0;} process(inputs){let peak=0;for(const c of (inputs[0]||[]))for(const v of c)peak=Math.max(peak,Math.abs(v));if(peak>this.peak){this.peak=peak;this.port.postMessage(peak);}return true;} } registerProcessor('test-meter',Meter);";
        const u = URL.createObjectURL(
          new Blob([source], { type: 'application/javascript' }),
        );
        await ctx.audioWorklet.addModule(u);
        URL.revokeObjectURL(u);
        const w = new AudioWorkletNode(ctx, 'test-meter');
        w.port.onmessage = (e) =>
          (item.workletPeak = Math.max(item.workletPeak || 0, e.data));
        item.analyser.connect(w);
        w.connect(ctx.destination);
      };
      const cg = this.createGain.bind(this);
      this.createGain = () => {
        const g = cg(),
          connect = g.connect.bind(g);
        g.connect = (target, ...rest) => {
          if (target === ctx.destination) {
            const a = ctx.createAnalyser();
            a.fftSize = 2048;
            item.analyser = a;
            connect(a);
            a.connect(target);
            return target;
          }
          return connect(target, ...rest);
        };
        return g;
      };
      const co = this.createOscillator.bind(this);
      this.createOscillator = () => {
        const o = co(),
          start = o.start.bind(o),
          stop = o.stop.bind(o);
        o.stop = (...a) => {
          item.stops = item.stops || [];
          item.stops.push({ time: a, stack: new Error().stack });
          return stop(...a);
        };
        o.start = (...a) => {
          item.noteStarts++;
          return start(...a);
        };
        return o;
      };
    }
  };
  localStorage.setItem('zeekr9x-entrance-seen-v1', '1');
  localStorage.setItem('zeekr9x-quality-v1', 'smooth');
  setInterval(() => {
    for (const item of window.__audio) {
      const a = item.analyser;
      if (!a) continue;
      const x = new Float32Array(a.fftSize);
      a.getFloatTimeDomainData(x);
      const rms = Math.sqrt(x.reduce((s, n) => s + n * n, 0) / x.length);
      item.peak = Math.max(item.peak || 0, rms);
    }
  }, 20);
});
const rms = () =>
  page.evaluate(() => {
    const a = window.__audio.at(-1)?.analyser;
    if (!a) return 0;
    const x = new Float32Array(a.fftSize);
    a.getFloatTimeDomainData(x);
    return Math.sqrt(x.reduce((s, n) => s + n * n, 0) / x.length);
  });
try {
  await page.goto(
    (process.env.QA_URL || 'http://127.0.0.1:4180/') +
      '?section=safety&hmi=takeover&orbit=false',
  );
  await page.waitForFunction(
    () =>
      document.querySelector('button[aria-label="放大"]')?.disabled === false,
    null,
    { timeout: 90000 },
  );
  await page.getByRole('button', { name: '更多选配', exact: true }).click();
  await page
    .getByRole('button', { name: '启用联动音效', exact: true })
    .waitFor({ timeout: 60000 });
  assert.equal(await page.evaluate(() => window.__audio.length), 0);
  await page.getByRole('button', { name: '试听当前音效', exact: true }).click();
  await page.waitForFunction(() => window.__audio.at(-1)?.noteStarts > 0);
  const peaks = [];
  for (let i = 0; i < 8; i++) {
    peaks.push(await rms());
    await page.waitForTimeout(60);
  }
  assert((await page.evaluate(() => window.__audio[0].workletPeak)) > 0.0001);
  await page.waitForTimeout(700);
  assert((await rms()) < 0.0001);
  await page.getByRole('button', { name: '启用联动音效', exact: true }).click();
  await page.getByRole('button', { name: '播放演示', exact: true }).click();
  await page.waitForTimeout(500);
  assert(
    (await page.evaluate(() => window.__audio.at(-1).ctx.state)) === 'running',
  );
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  await page.waitForTimeout(120);
  assert((await rms()) < 0.0001);
  await page.getByRole('button', { name: '播放演示', exact: true }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: '静音', exact: true }).click();
  await page.waitForTimeout(120);
  assert((await rms()) < 0.0001);
  assert.equal(await page.evaluate(() => window.__audio.length), 1);
  await page.screenshot({ path: 'outputs/scenario-audio-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole('region', { name: '场景音效', exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'outputs/scenario-audio-mobile.png' });
  await page.getByRole('button', { name: '外观', exact: true }).click();
  await page.waitForFunction(() => window.__audio[0].ctx.state === 'closed');
  assert.deepEqual(errors, []);
  console.log({
    noAutoplay: true,
    outputPeak: await page.evaluate(() => window.__audio[0].workletPeak),
    pauseSilent: true,
    muteSilent: true,
    singleContext: true,
    closedOnExit: true,
    errors,
  });
} catch (e) {
  console.log((await page.locator('body').innerText()).slice(-9000));
  throw e;
} finally {
  await browser.close();
}
