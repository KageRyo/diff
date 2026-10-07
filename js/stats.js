/**
 * @file Character classification and word counting. Pure functions without DOM access,
 * so the same code runs in the browser and in `node:test`.
 */

import { splitGraphemes } from './graphemes.js';
import { splitLines } from './lines.js';

const NEWLINE = /^(?:\r\n|[\n\r\u0085\u2028\u2029])$/u;
const SPACE = /^\s/u;
const EMOJI = /\p{Emoji_Presentation}|\uFE0F|\u20E3/u;
const HAN = /^\p{Script=Han}/u;
const LATIN = /^\p{Script=Latin}/u;
const DIGIT = /^\p{Nd}/u;
const SYMBOL = /^[\p{P}\p{S}]/u;
const KANA = /^[\p{Script=Hiragana}\p{Script=Katakana}\u30FC]/u;
const WORD_CHAR = /^[\p{L}\p{N}\p{M}]/u;

// Joiners keep a run of letters or digits together: don't, well-known, snake_case.
const JOINERS = new Set(["'", '\u2019', '-', '_']);
// Number joiners only connect digits: 3.14, 1,000.
const NUMBER_JOINERS = new Set(['.', ',']);

/** The categories every grapheme is sorted into; each grapheme belongs to exactly one. */
export const CATEGORIES = [
  'han', 'latin', 'digits', 'punctHalf', 'punctFull',
  'spaceHalf', 'spaceFull', 'newlines', 'emoji', 'other',
];

/**
 * @typedef {object} StatsOptions
 * @property {boolean} [includeHalfSpace=true] Count half-width spaces and tabs as characters.
 * @property {boolean} [includeFullSpace=true] Count full-width spaces (U+3000) as characters.
 * @property {boolean} [includeNewline=false] Count line breaks as characters.
 * @property {boolean} [wordsIncludePunct=false] Count each punctuation mark as a word.
 */

/** @type {Readonly<Required<StatsOptions>>} */
export const DEFAULT_STATS_OPTIONS = Object.freeze({
  includeHalfSpace: true,
  includeFullSpace: true,
  includeNewline: false,
  wordsIncludePunct: false,
});

/**
 * Returns the single category a grapheme cluster belongs to. The order of the checks matters:
 * a keycap emoji (a digit followed by U+FE0F and U+20E3) is emoji rather than a digit, and
 * U+3000 is caught as a full-width space before the general `\s` check.
 * @param {string} grapheme
 * @returns {string} One of CATEGORIES.
 */
export function classify(grapheme) {
  if (NEWLINE.test(grapheme)) return 'newlines';
  if (grapheme === '\u3000') return 'spaceFull';
  if (SPACE.test(grapheme)) return 'spaceHalf';
  if (EMOJI.test(grapheme)) return 'emoji';
  if (HAN.test(grapheme)) return 'han';
  if (LATIN.test(grapheme)) return 'latin';
  if (DIGIT.test(grapheme)) return 'digits';
  if (SYMBOL.test(grapheme)) return grapheme.codePointAt(0) <= 0x7e ? 'punctHalf' : 'punctFull';
  return 'other';
}

// Chinese characters and kana count as one word each, like in word processors.
const isPerCharWord = (grapheme, kind) => kind === 'han' || (kind === 'other' && KANA.test(grapheme));

// Other letters, digits, and marks build runs that count as one word together.
const isTokenChar = (grapheme, kind) =>
  kind !== 'emoji' && !isPerCharWord(grapheme, kind) && WORD_CHAR.test(grapheme);

/** Whether the joiner at `index` continues the current run of letters or digits instead of ending it. */
function joinsToken(graphemes, kinds, index) {
  const next = index + 1;
  if (next >= graphemes.length) return false;
  if (JOINERS.has(graphemes[index])) return isTokenChar(graphemes[next], kinds[next]);
  if (NUMBER_JOINERS.has(graphemes[index])) return kinds[index - 1] === 'digits' && kinds[next] === 'digits';
  return false;
}

/**
 * @typedef {object} Stats
 * @property {number} characters Graphemes, minus the whitespace categories the options exclude.
 * @property {number} words Chinese characters and kana count one each; each run of letters or digits counts one.
 * @property {number} englishWords Runs of letters or digits that contain a Latin letter.
 * @property {number} han
 * @property {number} latin
 * @property {number} digits
 * @property {number} punctHalf ASCII punctuation and symbols.
 * @property {number} punctFull All other punctuation and symbols.
 * @property {number} spaceHalf Spaces, tabs, and other whitespace except U+3000.
 * @property {number} spaceFull
 * @property {number} newlines
 * @property {number} emoji
 * @property {number} other
 * @property {number} lines
 * @property {number} paragraphs Lines that contain anything other than whitespace.
 */

/**
 * Counts the characters and words in `text`.
 * @param {string} text
 * @param {StatsOptions} [options] Unknown keys are ignored, so the app can pass its whole settings object.
 * @returns {Stats}
 */
export function countText(text, options = {}) {
  const opts = { ...DEFAULT_STATS_OPTIONS, ...options };
  const graphemes = splitGraphemes(text);
  const kinds = graphemes.map(classify);
  const categories = Object.fromEntries(CATEGORIES.map((key) => [key, 0]));
  let words = 0;
  let englishWords = 0;
  let token = null;

  const endToken = () => {
    if (!token) return;
    words += 1;
    if (token.hasLatin) englishWords += 1;
    token = null;
  };

  graphemes.forEach((grapheme, index) => {
    const kind = kinds[index];
    categories[kind] += 1;
    if (isTokenChar(grapheme, kind)) {
      token ??= { hasLatin: false };
      if (kind === 'latin') token.hasLatin = true;
      return;
    }
    if (token && joinsToken(graphemes, kinds, index)) return;
    endToken();
    if (isPerCharWord(grapheme, kind)) {
      words += 1;
    } else if (opts.wordsIncludePunct && (kind === 'punctHalf' || kind === 'punctFull')) {
      words += 1;
    }
  });
  endToken();

  let characters = graphemes.length;
  if (!opts.includeHalfSpace) characters -= categories.spaceHalf;
  if (!opts.includeFullSpace) characters -= categories.spaceFull;
  if (!opts.includeNewline) characters -= categories.newlines;

  const lines = splitLines(text);
  return {
    characters,
    words,
    englishWords,
    ...categories,
    lines: lines.length,
    paragraphs: lines.filter((line) => /\S/u.test(line)).length,
  };
}

/**
 * Returns countText with a one-entry cache, so an unchanged side is not counted again.
 * @returns {(text: string, options?: StatsOptions) => Stats}
 */
export function createCounter() {
  let last = null;
  return (text, options = {}) => {
    const opts = Object.fromEntries(Object.keys(DEFAULT_STATS_OPTIONS).map((key) => [key, options[key] ?? DEFAULT_STATS_OPTIONS[key]]));
    const unchanged = last?.text === text && Object.keys(opts).every((key) => last.opts[key] === opts[key]);
    if (!unchanged) last = { text, opts, stats: countText(text, opts) };
    return last.stats;
  };
}
