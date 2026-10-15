import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const bundlePath = fileURLToPath(
  new URL('../../bundles/stomp.umd.js', import.meta.url),
);
const timeout = 15000;
const browser = await chromium.launch({ headless: true, timeout });
const pageErrors = [];
let timeoutId;

try {
  await Promise.race([
    (async () => {
      const page = await browser.newPage();
      page.setDefaultTimeout(timeout);
      page.on('pageerror', error => pageErrors.push(error));

      await page.addScriptTag({ path: bundlePath, type: 'text/javascript' });
      assert.equal(
        await page.evaluate(() => typeof window.StompJs?.Client),
        'function',
        'The classic browser script must expose StompJs.Client as a function',
      );
      assert.equal(
        await page.evaluate(() => new window.StompJs.Client().active),
        false,
        'A newly constructed browser client must be inactive',
      );
    })(),
    new Promise((resolve, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error('Browser UMD smoke check timed out')),
        timeout,
      );
    }),
  ]);
} finally {
  clearTimeout(timeoutId);
  await browser.close();
}

assert.equal(
  pageErrors.length,
  0,
  `The browser script must not produce uncaught errors: ${pageErrors
    .map(error => error.stack || error.message)
    .join('\n')}`,
);
console.log('Browser UMD smoke check passed');