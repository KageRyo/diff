import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES, countText } from '../js/stats.js';
import { splitLines } from '../js/lines.js';

test('splitLines handles every line break and empty text', () => {
  assert.deepEqual(splitLines(''), []);
  assert.deepEqual(splitLines('a'), ['a']);
  assert.deepEqual(splitLines('a\r\nb\nc\rd\u2028e'), ['a', 'b', 'c', 'd', 'e']);
  assert.deepEqual(splitLines('a\n'), ['a', '']);
});

test('empty text has all-zero statistics', () => {
  for (const value of Object.values(countText(''))) assert.equal(value, 0);
});

test('counts each Chinese character as one word', () => {
  const stats = countText('我愛台灣');
  assert.equal(stats.han, 4);
  assert.equal(stats.words, 4);
  assert.equal(stats.characters, 4);
});

test('counts English words and letters', () => {
  const stats = countText('Hello world');
  assert.equal(stats.latin, 10);
  assert.equal(stats.englishWords, 2);
  assert.equal(stats.words, 2);
  assert.equal(stats.spaceHalf, 1);
  assert.equal(stats.characters, 11);
});

test('counts mixed Chinese and English text', () => {
  const stats = countText('我用 GitHub 寫 code');
  assert.equal(stats.han, 3);
  assert.equal(stats.latin, 10);
  assert.equal(stats.englishWords, 2);
  assert.equal(stats.words, 5);
  assert.equal(stats.characters, 16);
});

test('classifies full-width and half-width letters, digits and symbols', () => {
  const stats = countText('Ａ０，A0,');
  assert.equal(stats.latin, 2);
  assert.equal(stats.digits, 2);
  assert.equal(stats.punctFull, 1);
  assert.equal(stats.punctHalf, 1);
  assert.equal(stats.words, 2);
  assert.equal(stats.englishWords, 2);
});

test('separates half-width spaces, full-width spaces, tabs and line breaks', () => {
  const stats = countText('a b\tc\u3000d\ne');
  assert.equal(stats.spaceHalf, 2);
  assert.equal(stats.spaceFull, 1);
  assert.equal(stats.newlines, 1);
  assert.equal(stats.characters, 8);
});

test('character count follows the whitespace options', () => {
  const text = 'a b\u3000c\nd';
  assert.equal(countText(text).characters, 6);
  assert.equal(countText(text, { includeHalfSpace: false }).characters, 5);
  assert.equal(countText(text, { includeFullSpace: false }).characters, 5);
  assert.equal(countText(text, { includeNewline: true }).characters, 7);
  assert.equal(countText(text, { includeHalfSpace: false, includeFullSpace: false }).characters, 4);
});

test('treats CRLF as a single line break', () => {
  const stats = countText('a\r\nb', { includeNewline: true });
  assert.equal(stats.newlines, 1);
  assert.equal(stats.lines, 2);
  assert.equal(stats.characters, 3);
});

test('counts emoji sequences as single characters', () => {
  const stats = countText('👨‍👩‍👧1️⃣😀');
  assert.equal(stats.emoji, 3);
  assert.equal(stats.digits, 0);
  assert.equal(stats.characters, 3);
  assert.equal(stats.words, 0);
});

test('does not treat text-style symbols as emoji', () => {
  const stats = countText('©™');
  assert.equal(stats.emoji, 0);
  assert.equal(stats.punctFull, 2);
});

test('counts a combining sequence as one letter', () => {
  const stats = countText('e\u0301');
  assert.equal(stats.latin, 1);
  assert.equal(stats.characters, 1);
  assert.equal(stats.words, 1);
});

test('keeps joined tokens as single words', () => {
  for (const word of ["don't", 'don’t', 'well-known', 'snake_case', '3.14', '1,000', 'iPhone15', 'v1.2']) {
    assert.equal(countText(word).words, 1, word);
  }
});

test('splits words on commas and periods between letters', () => {
  assert.equal(countText('a,b').words, 2);
  assert.equal(countText('end.Next').words, 2);
  assert.equal(countText("rock 'n").words, 2);
});

test('english word count ignores digit-only tokens', () => {
  const stats = countText('version 2 of 3.0');
  assert.equal(stats.words, 4);
  assert.equal(stats.englishWords, 2);
});

test('optionally counts punctuation marks as words', () => {
  const text = '你好，世界！Hi, there.';
  assert.equal(countText(text).words, 6);
  assert.equal(countText(text, { wordsIncludePunct: true }).words, 10);
  assert.equal(countText("don't", { wordsIncludePunct: true }).words, 1);
});

test('counts kana per character and Hangul per word', () => {
  const kana = countText('ラーメン');
  assert.equal(kana.words, 4);
  assert.equal(kana.other, 4);
  const hangul = countText('안녕 하세요');
  assert.equal(hangul.words, 2);
  assert.equal(hangul.other, 5);
});

test('counts lines and non-blank paragraphs', () => {
  const stats = countText('第一段\n\n第二段\n\u3000\n');
  assert.equal(stats.lines, 5);
  assert.equal(stats.paragraphs, 2);
});

test('categories add up to the total number of characters', () => {
  const text = 'Hi 你好！\u3000😀\n123 ラ';
  const stats = countText(text, { includeNewline: true });
  const sum = CATEGORIES.reduce((total, key) => total + stats[key], 0);
  assert.equal(sum, stats.characters);
});
