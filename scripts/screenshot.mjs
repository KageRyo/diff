import { chromium } from 'playwright';
import { startServer } from './serve.mjs';

const output = process.argv[2] ?? 'docs/images/screenshot.png';
const original = [
  'Diff 是一個在瀏覽器中執行的文字比對工具。',
  '貼上兩段文字，即可看到逐行差異。',
  '支援中英混排，例如 GitHub 與 Git。',
  '所有處理都在本機完成。',
].join('\n');
const modified = [
  'Diff 是一個完全在瀏覽器中執行的文字比對工具。',
  '貼上兩段文字，就能即時看到逐行與逐字差異。',
  '支援中英混排，例如 GitHub 與 Git。',
  '所有處理都在本機完成，不會上傳。',
  '同時統計字數、字元數、中文字與英文單字。',
].join('\n');

const server = await startServer(0);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: 'zh-TW', colorScheme: 'light' });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.fill('#left-input', original);
  await page.fill('#right-input', modified);
  await page.waitForSelector('.diff-table');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: output, fullPage: true });
  console.log(`Saved ${output}`);
} finally {
  await browser.close();
  server.close();
}
