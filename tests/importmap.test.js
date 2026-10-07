import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('the import map pins the same jsdiff version as package.json', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const match = html.match(/<script type="importmap">([\s\S]*?)<\/script>/);
  assert.ok(match, 'index.html has an import map');
  const { imports } = JSON.parse(match[1]);
  assert.equal(imports.diff, `https://cdn.jsdelivr.net/npm/diff@${pkg.dependencies.diff}/libesm/index.js`);
});
