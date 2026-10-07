import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LANGUAGES, messages } from '../js/i18n.js';
import { STAT_GROUPS } from '../js/render.js';

test('supports Traditional Chinese and English', () => {
  assert.deepEqual(LANGUAGES, ['zh-TW', 'en']);
});

test('every language defines the same message keys', () => {
  const base = Object.keys(messages['zh-TW']).sort();
  for (const lang of LANGUAGES) assert.deepEqual(Object.keys(messages[lang]).sort(), base, lang);
});

test('every key used in index.html has a message', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const keys = [...html.matchAll(/data-i18n(?:-placeholder|-aria-label)?="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(keys.length > 20);
  for (const key of keys) assert.ok(Object.hasOwn(messages['zh-TW'], key), key);
});

test('every statistic has a label', () => {
  for (const key of Object.values(STAT_GROUPS).flat()) {
    assert.ok(Object.hasOwn(messages['zh-TW'], `stats.${key}`), key);
  }
});
