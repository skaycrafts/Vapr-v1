/**
 * Design-review capture. Drives a real Chromium at a chosen viewport, scrolls
 * the page so every ScrollTrigger and IntersectionObserver has fired, and
 * writes one PNG per stop.
 *
 *   node scripts/shots.mjs [--w 1440] [--h 900] [--out DIR] [--full]
 *                          [--reduced] [--url http://localhost:3000]
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};
const has = (name) => argv.includes(`--${name}`);

const width = Number(flag('w', 1440));
const height = Number(flag('h', 900));
const url = flag('url', 'http://localhost:3000');
const outDir = flag('out', 'C:/Users/muhit/AppData/Local/Temp/claude/D--VAPR/0b4ee4d1-e688-469d-905c-7adfbba7b864/scratchpad/shots');
const reduced = has('reduced');

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--enable-gpu'],
});
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 1,
  reducedMotion: reduced ? 'reduce' : 'no-preference',
});
const page = await context.newPage();

const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`);
});
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));

await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
// Let the entry sequence run out.
await page.waitForTimeout(reduced ? 1200 : 4200);

const total = await page.evaluate(() => document.body.scrollHeight);
console.log(`page height: ${total}px  (${(total / height).toFixed(1)} screens)`);

if (has('full')) {
  // Walk down in viewport steps so lazy images and pins all resolve.
  const steps = Math.ceil(total / height);
  for (let i = 0; i < steps; i++) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), i * height);
    await page.waitForTimeout(220);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(900);
}

const stops = Number(flag('stops', 14));
const tag = `${width}${reduced ? '-reduced' : ''}`;
for (let i = 0; i < stops; i++) {
  const y = Math.round((total - height) * (i / (stops - 1)));
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
  await page.waitForTimeout(reduced ? 260 : 950);
  await page.screenshot({ path: path.join(outDir, `${tag}-${String(i).padStart(2, '0')}.png`) });
}

console.log(`wrote ${stops} shots to ${outDir}`);
if (errors.length) {
  console.log('\nconsole:');
  console.log([...new Set(errors)].slice(0, 25).join('\n'));
}

await browser.close();
