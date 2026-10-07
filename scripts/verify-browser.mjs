import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';

const server = await startServer(0);
const baseUrl = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const errors = [];

const statNumber = (page, side, key) =>
  page.locator(`#${side}-stats [data-stat="${key}"] .stat-number`).textContent();

const waitForText = (page, selector, expected) =>
  page.waitForFunction(([s, e]) => document.querySelector(s)?.textContent === e, [selector, expected]);

const waitForOutput = (page, fragment) =>
  page.waitForFunction((f) => document.querySelector('#diff-output')?.textContent.includes(f), fragment);

async function check(name, run) {
  await run();
  console.log(`✓ ${name}`);
}

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: 'zh-TW' });
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(baseUrl);

  await check('shows the empty state in Traditional Chinese', async () => {
    await page.waitForSelector('.diff-empty');
    assert.equal(await page.textContent('#left-title'), '原始文字');
  });

  await check('updates statistics and the diff while typing', async () => {
    await page.fill('#left-input', '我愛台灣\nHello world\n相同的一行');
    await page.fill('#right-input', '我很愛臺灣\nHello world\n相同的一行\n新增 123');
    await waitForText(page, '#diff-summary .is-added', '+2');
    assert.equal(await page.textContent('#diff-summary .is-removed'), '\u22121');
    assert.equal(await statNumber(page, 'left', 'words'), '11');
    assert.equal(await statNumber(page, 'right', 'words'), '15');
    assert.equal(await statNumber(page, 'left', 'characters'), '20');
    assert.equal(await page.textContent('#right-stats [data-stat="words"] .stat-delta'), '+4');
    assert.ok((await page.locator('.diff-table.is-split mark').count()) > 0);
  });

  await check('statistics options change the character count', async () => {
    await page.uncheck('input[data-setting="includeHalfSpace"]');
    await waitForText(page, '#left-stats [data-stat="characters"] .stat-number', '19');
    await page.check('input[data-setting="includeHalfSpace"]');
    await waitForText(page, '#left-stats [data-stat="characters"] .stat-number', '20');
  });

  await check('switches to the unified view', async () => {
    await page.click('[data-view="unified"]');
    await page.waitForSelector('.diff-table.is-unified');
    assert.deepEqual(await page.locator('.diff-marker').allTextContents(), ['-', '+', ' ', ' ', '+']);
  });

  await check('collapses unchanged lines', async () => {
    const lines = Array.from({ length: 10 }, (_, i) => `line ${i + 1}`);
    await page.fill('#left-input', lines.join('\n'));
    await page.fill('#right-input', [...lines.slice(0, 9), 'line ten'].join('\n'));
    await page.check('input[data-setting="collapse"]');
    await waitForText(page, '.diff-skip', '⋯ 6 行未變更');
    await page.uncheck('input[data-setting="collapse"]');
  });

  await check('renders untrusted text literally', async () => {
    await page.fill('#left-input', '<img src=x onerror="window.__xss = true">');
    await page.fill('#right-input', '<b>bold</b>');
    await waitForOutput(page, '<b>bold</b>');
    assert.equal(await page.locator('#diff-output img, #diff-output b').count(), 0);
    assert.equal(await page.evaluate(() => window.__xss), undefined);
  });

  await check('switches language', async () => {
    await page.click('#lang-toggle');
    await waitForText(page, '#left-title', 'Original');
    assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
    assert.equal(await page.title(), 'Diff · Text Compare & Word Count');
  });

  await check('cycles themes', async () => {
    await page.click('#theme-toggle');
    assert.equal(await page.evaluate(() => document.body.className), 'is-light');
    await page.click('#theme-toggle');
    assert.equal(await page.evaluate(() => document.body.className), 'is-dark');
  });

  await check('restores settings but not text after reload', async () => {
    await page.reload();
    await page.waitForSelector('.diff-empty');
    assert.equal(await page.inputValue('#left-input'), '');
    assert.equal(await page.textContent('#left-title'), 'Original');
    assert.equal(await page.evaluate(() => document.body.className), 'is-dark');
    assert.equal(await page.getAttribute('[data-view="unified"]', 'aria-pressed'), 'true');
  });

  await check('ignores corrupted settings', async () => {
    await page.evaluate(() => localStorage.setItem('diff:settings', '{not json'));
    await page.reload();
    await page.waitForSelector('.diff-empty');
    await page.evaluate(() => localStorage.setItem('diff:settings', JSON.stringify({ theme: 'purple', view: 42, lang: 'xx' })));
    await page.reload();
    await page.waitForSelector('.diff-empty');
    assert.equal(await page.evaluate(() => document.body.className), '');
    assert.equal(await page.getAttribute('[data-view="split"]', 'aria-pressed'), 'true');
    assert.equal(await page.textContent('#left-title'), '原始文字');
  });

  await check('stays responsive with large input', async () => {
    const big = (prefix) => Array.from({ length: 3000 }, (_, i) => `${prefix} line ${i}`).join('\n');
    await page.fill('#left-input', big('old'));
    await page.fill('#right-input', big('new'));
    // Wait for the final render: an earlier debounce may have rendered the left side alone.
    await waitForText(page, '#diff-summary .is-added', '+3,000');
    assert.ok((await page.locator('.diff-table tr').count()) >= 3000);
    assert.equal(await statNumber(page, 'right', 'lines'), '3,000');
  });

  await check('fits a phone screen without horizontal scrolling', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.fill('#left-input', `https://example.com/${'a'.repeat(300)}`);
    await page.fill('#right-input', `https://example.com/${'b'.repeat(300)}`);
    await waitForOutput(page, 'bbbb');
    const overflow = await page.evaluate(() =>
      Math.max(...[...document.querySelectorAll('.app *')].map((node) => node.getBoundingClientRect().right)) - window.innerWidth,
    );
    assert.ok(overflow <= 1, `content overflows the viewport by ${overflow}px`);
    const clipped = await page.$$eval('.diff-text', (cells) => cells.filter((cell) => cell.scrollWidth > cell.clientWidth + 1).length);
    assert.equal(clipped, 0, 'long lines wrap inside their cells');
  });

  assert.deepEqual(errors, [], 'no console errors');
  console.log('All browser checks passed.');
} finally {
  await browser.close();
  server.close();
}
