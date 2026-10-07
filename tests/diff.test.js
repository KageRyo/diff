import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collapseRows, computeDiff } from '../js/diff.js';

const types = (result) => result.rows.map((row) => row.type);
const changedText = (segments) => segments.filter((s) => s.changed).map((s) => s.text).join('|');
const joined = (segments) => segments.map((s) => s.text).join('');

test('identical texts produce only equal rows', () => {
  const result = computeDiff('a\nb', 'a\nb');
  assert.deepEqual(types(result), ['equal', 'equal']);
  assert.equal(result.identical, true);
  assert.equal(result.added, 0);
  assert.equal(result.removed, 0);
  assert.equal(result.timedOut, false);
});

test('two empty texts have no rows and are identical', () => {
  const result = computeDiff('', '');
  assert.deepEqual(result.rows, []);
  assert.equal(result.identical, true);
});

test('an empty side shows every line as inserted', () => {
  const result = computeDiff('', 'a\nb');
  assert.deepEqual(types(result), ['insert', 'insert']);
  assert.deepEqual(result.rows.map((row) => row.right.no), [1, 2]);
  assert.equal(result.added, 2);
  assert.equal(result.removed, 0);
});

test('detects deleted and inserted lines with line numbers', () => {
  const result = computeDiff('a\nb\nc', 'a\nc\nd');
  assert.deepEqual(types(result), ['equal', 'delete', 'equal', 'insert']);
  assert.deepEqual(result.rows[1].left, { no: 2, text: 'b', segments: null });
  assert.equal(result.rows[1].right, null);
  assert.equal(result.rows[2].left.no, 3);
  assert.equal(result.rows[2].right.no, 2);
  assert.deepEqual(result.rows[3].right, { no: 3, text: 'd', segments: null });
});

test('a trailing line break shows up as an inserted empty line', () => {
  const result = computeDiff('a', 'a\n');
  assert.deepEqual(types(result), ['equal', 'insert']);
  assert.equal(result.rows[1].right.text, '');
});

test('pairs modified lines and highlights changed Chinese characters', () => {
  const [row] = computeDiff('我愛台灣', '我很愛臺灣').rows;
  assert.equal(row.type, 'change');
  assert.deepEqual(row.left.segments, [
    { text: '我愛', changed: false },
    { text: '台', changed: true },
    { text: '灣', changed: false },
  ]);
  assert.deepEqual(row.right.segments, [
    { text: '我', changed: false },
    { text: '很', changed: true },
    { text: '愛', changed: false },
    { text: '臺', changed: true },
    { text: '灣', changed: false },
  ]);
});

test('unpaired lines in a modified block become inserts or deletes', () => {
  assert.deepEqual(types(computeDiff('a1', 'a2\nb')), ['change', 'insert']);
  assert.deepEqual(types(computeDiff('a1\nb', 'a2')), ['change', 'delete']);
});

test('counts a changed line as one addition and one removal', () => {
  const result = computeDiff('a\nb', 'a\nc');
  assert.equal(result.added, 1);
  assert.equal(result.removed, 1);
  assert.equal(result.identical, false);
});

test('skips inline highlights when lines are too different', () => {
  const [row] = computeDiff('abc', 'xyz').rows;
  assert.equal(row.type, 'change');
  assert.equal(row.left.segments, null);
  assert.equal(row.right.segments, null);
});

test('handles astral characters in inline highlights', () => {
  const [row] = computeDiff('a😀b', 'a😀c').rows;
  assert.deepEqual(row.left.segments, [{ text: 'a😀', changed: false }, { text: 'b', changed: true }]);
  assert.deepEqual(row.right.segments, [{ text: 'a😀', changed: false }, { text: 'c', changed: true }]);
});

test('inline segments always rebuild the original emoji sequences', () => {
  const [row] = computeDiff('家人 👨‍👩‍👧 都在', '家人 👨‍👩‍👦 都在').rows;
  assert.equal(row.type, 'change');
  assert.equal(joined(row.left.segments), '家人 👨‍👩‍👧 都在');
  assert.equal(joined(row.right.segments), '家人 👨‍👩‍👦 都在');
});

test('ignoreWhitespace treats half-width and full-width spacing changes as equal', () => {
  const result = computeDiff('a b\nc', 'ab\u3000\nc', { ignoreWhitespace: true });
  assert.equal(result.identical, true);
  assert.equal(result.rows[0].left.text, 'a b');
  assert.equal(result.rows[0].right.text, 'ab\u3000');
});

test('whitespace changes are differences by default', () => {
  assert.equal(computeDiff('a b', 'ab').identical, false);
});

test('ignoreWhitespace does not highlight whitespace-only inline changes', () => {
  const [plain] = computeDiff('foo bar baz', 'foo  bar qux').rows;
  assert.equal(changedText(plain.right.segments), ' |qux');
  const [ignored] = computeDiff('foo bar baz', 'foo  bar qux', { ignoreWhitespace: true }).rows;
  assert.equal(changedText(ignored.right.segments), 'qux');
});

test('ignoreCase compares lines case-insensitively but keeps the original text', () => {
  const result = computeDiff('Hello\nWorld', 'hello\nWORLD', { ignoreCase: true });
  assert.equal(result.identical, true);
  assert.equal(result.rows[0].left.text, 'Hello');
  assert.equal(result.rows[0].right.text, 'hello');
});

test('ignoreCase keeps the original text in inline segments', () => {
  const [row] = computeDiff('Hello there', 'HELLO where', { ignoreCase: true }).rows;
  assert.equal(joined(row.left.segments), 'Hello there');
  assert.equal(joined(row.right.segments), 'HELLO where');
  assert.equal(changedText(row.right.segments), 'w');
});

test('treats CRLF and LF line endings the same', () => {
  assert.equal(computeDiff('a\r\nb', 'a\nb').identical, true);
});

test('falls back to replacing everything when the diff times out', () => {
  const oldText = Array.from({ length: 5000 }, (_, i) => `old ${i}`).join('\n');
  const newText = Array.from({ length: 5000 }, (_, i) => `new ${i}`).join('\n');
  const result = computeDiff(oldText, newText, { timeout: 1 });
  assert.equal(result.timedOut, true);
  assert.equal(result.identical, false);
  assert.equal(result.removed, 5000);
  assert.equal(result.added, 5000);
  assert.equal(result.rows[0].type, 'delete');
  assert.equal(result.rows.at(-1).type, 'insert');
});

const equalRow = (no) => ({ type: 'equal', left: { no }, right: { no } });
const deleteRow = { type: 'delete', left: { no: 0 }, right: null };

test('collapseRows keeps three lines of context around changes', () => {
  const rows = [...Array.from({ length: 10 }, (_, i) => equalRow(i)), deleteRow, ...Array.from({ length: 10 }, (_, i) => equalRow(i))];
  const collapsed = collapseRows(rows);
  assert.deepEqual(collapsed.map((row) => row.type), ['skip', 'equal', 'equal', 'equal', 'delete', 'equal', 'equal', 'equal', 'skip']);
  assert.equal(collapsed[0].count, 7);
  assert.equal(collapsed.at(-1).count, 7);
});

test('collapseRows turns unchanged text into a single skip row', () => {
  assert.deepEqual(collapseRows([equalRow(1), equalRow(2)]), [{ type: 'skip', count: 2 }]);
});

test('collapseRows keeps short gaps between changes', () => {
  const rows = [deleteRow, equalRow(1), equalRow(2), deleteRow];
  assert.deepEqual(collapseRows(rows), rows);
});

test('collapseRows accepts an empty list', () => {
  assert.deepEqual(collapseRows([]), []);
});

function randomHan(seed, length) {
  let state = seed;
  return Array.from({ length }, () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return String.fromCodePoint(0x4e00 + (state % 500));
  }).join('');
}

test('caps the total time spent on inline highlights', () => {
  const oldText = Array.from({ length: 100 }, (_, i) => randomHan(i + 1, 1500)).join('\n');
  const newText = Array.from({ length: 100 }, (_, i) => randomHan(i + 1001, 1500)).join('\n');
  const started = performance.now();
  const result = computeDiff(oldText, newText);
  const elapsed = performance.now() - started;
  assert.equal(result.rows.length, 100);
  assert.ok(result.rows.every((row) => row.type === 'change'));
  assert.ok(elapsed < 1500, `took ${Math.round(elapsed)} ms`);
});

test('inline highlights cover whole grapheme clusters', () => {
  const changedTexts = (segments) => segments.filter((s) => s.changed).map((s) => s.text);
  const cases = [
    ['cafe\u0301 au lait', 'cafe au lait', ['e\u0301'], ['e']],
    ['國旗 🇹🇼 飄揚', '國旗 🇹🇭 飄揚', ['🇹🇼'], ['🇹🇭']],
    ['讚 👍🏻 喔', '讚 👍🏿 喔', ['👍🏻'], ['👍🏿']],
    ['家人 👨‍👩‍👧 都在', '家人 👨‍👩‍👦 都在', ['👨‍👩‍👧'], ['👨‍👩‍👦']],
  ];
  for (const [oldLine, newLine, removed, added] of cases) {
    const [row] = computeDiff(oldLine, newLine).rows;
    assert.deepEqual(changedTexts(row.left.segments), removed, oldLine);
    assert.deepEqual(changedTexts(row.right.segments), added, newLine);
  }
});
