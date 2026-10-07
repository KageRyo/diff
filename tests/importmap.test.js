import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('the import map loads jsdiff from the installed npm package', async () => {
  const match = html.match(/<script type="importmap">([\s\S]*?)<\/script>/);
  assert.ok(match, 'index.html has an import map');
  const { imports } = JSON.parse(match[1]);
  assert.equal(imports.diff, './node_modules/diff/libesm/index.js');
  await access(new URL(`../${imports.diff}`, import.meta.url));
});

test('no script is loaded from another host', () => {
  const sources = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((match) => match[1]);
  const mapped = [...html.matchAll(/"(https?:\/\/[^"]+\.m?js)"/g)].map((match) => match[1]);
  assert.deepEqual([...sources, ...mapped].filter((url) => /^https?:/.test(url)), []);
});
