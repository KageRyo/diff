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

export const CATEGORIES = [
  'han', 'latin', 'digits', 'punctHalf', 'punctFull',
  'spaceHalf', 'spaceFull', 'newlines', 'emoji', 'other',
];

export const DEFAULT_STATS_OPTIONS = Object.freeze({
  includeHalfSpace: true,
  includeFullSpace: true,
  includeNewline: false,
  wordsIncludePunct: false,
});

/** Returns the single category a grapheme cluster belongs to. */
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

const isPerCharWord = (grapheme, kind) => kind === 'han' || (kind === 'other' && KANA.test(grapheme));

const isTokenChar = (grapheme, kind) =>
  kind !== 'emoji' && !isPerCharWord(grapheme, kind) && WORD_CHAR.test(grapheme);

function joinsToken(graphemes, kinds, index) {
  const next = index + 1;
  if (next >= graphemes.length) return false;
  if (JOINERS.has(graphemes[index])) return isTokenChar(graphemes[next], kinds[next]);
  if (NUMBER_JOINERS.has(graphemes[index])) return kinds[index - 1] === 'digits' && kinds[next] === 'digits';
  return false;
}

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

/** Returns countText with a one-entry cache, so an unchanged side is not counted again. */
export function createCounter() {
  let last = null;
  return (text, options = {}) => {
    const opts = Object.fromEntries(Object.keys(DEFAULT_STATS_OPTIONS).map((key) => [key, options[key] ?? DEFAULT_STATS_OPTIONS[key]]));
    const unchanged = last?.text === text && Object.keys(opts).every((key) => last.opts[key] === opts[key]);
    if (!unchanged) last = { text, opts, stats: countText(text, opts) };
    return last.stats;
  };
}
