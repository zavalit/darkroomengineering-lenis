import puppeteer from 'puppeteer';
import assert from 'node:assert';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(__dirname, 'fixtures', 'scroll.html');

async function run(type) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const events = [];
  await page.exposeFunction('recordEvent', (e) => events.push(e));

  await page.goto('file://' + htmlPath);
  await page.evaluate(() => {
    window.lenis.on('virtual-scroll', () => window.recordEvent('virtual'));
    window.lenis.on('scroll', () => window.recordEvent('scroll'));
  });

  if (type === 'wheel') {
    await page.evaluate(() => {
      const e = new WheelEvent('wheel', { deltaY: 100, bubbles: true });
      document.dispatchEvent(e);
    });
  } else {
    await page.evaluate(() => {
      const start = new TouchEvent('touchstart', {
        touches: [new Touch({ identifier: 0, target: document.body, clientX: 0, clientY: 0 })],
        bubbles: true,
        cancelable: true,
      });
      const move = new TouchEvent('touchmove', {
        touches: [new Touch({ identifier: 0, target: document.body, clientX: 0, clientY: 50 })],
        bubbles: true,
        cancelable: true,
      });
      const end = new TouchEvent('touchend', {
        changedTouches: [new Touch({ identifier: 0, target: document.body, clientX: 0, clientY: 50 })],
        bubbles: true,
        cancelable: true,
      });
      document.body.dispatchEvent(start);
      document.body.dispatchEvent(move);
      document.body.dispatchEvent(end);
    });
  }

  await page.waitForTimeout(100);
  await browser.close();

  assert.ok(events.includes('virtual'), `virtual-scroll not fired for ${type}`);
  assert.ok(events.includes('scroll'), `scroll not fired for ${type}`);
}

(async () => {
  await run('wheel');
  await run('touch');
  console.log('All tests passed');
})();
