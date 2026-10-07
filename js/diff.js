/**
 * @file Line-by-line diff with inline highlights, built on jsdiff. Pure functions without DOM
 * access, so the same code runs in the browser and in `node:test`.
 */

import { diffArrays } from 'diff';
import { splitGraphemes } from './graphemes.js';
import { splitLines } from './lines.js';

// Inline highlights are skipped for lines longer than this many graphemes,
const INLINE_MAX_LENGTH = 5000;
// and for pairs of lines that share less than half of their graphemes.
const INLINE_MIN_SIMILARITY = 0.5;
// Time limit in milliseconds for highlighting one line.
const INLINE_TIMEOUT = 100;
// Total time for all inline highlights in one diff; later changed lines are highlighted whole.
const INLINE_BUDGET = 500;
const WHITESPACE = /\s/gu;
const WHITESPACE_ONLY = /^\s+$/u;

/**
 * @typedef {object} Segment
 * @property {string} text
 * @property {boolean} changed Whether this part of the line was added or removed.
 */

/**
 * @typedef {object} Line
 * @property {number} no 1-based line number on its own side.
 * @property {string} text The original text of the line.
 * @property {Segment[] | null} segments Inline highlights, or null to highlight the whole line.
 */

/**
 * @typedef {object} Row
 * @property {'equal' | 'delete' | 'insert' | 'change'} type
 * @property {Line | null} left
 * @property {Line | null} right
 */

/**
 * @typedef {object} DiffResult
 * @property {Row[]} rows
 * @property {number} added Lines added; a changed line counts once here and once in `removed`.
 * @property {number} removed Lines removed.
 * @property {boolean} identical Whether the texts match under the current options.
 * @property {boolean} timedOut Whether the line comparison gave up and shows a full replacement.
 */

/**
 * Compares two texts line by line, then highlights the changed graphemes inside each modified line.
 * @param {string} oldText
 * @param {string} newText
 * @param {{ ignoreWhitespace?: boolean, ignoreCase?: boolean, timeout?: number }} [options]
 *   `timeout` limits the line comparison in milliseconds. Unknown keys are ignored.
 * @returns {DiffResult}
 */
export function computeDiff(oldText, newText, options = {}) {
  const { ignoreWhitespace = false, ignoreCase = false, timeout = 2000 } = options;
  const oldLines = splitLines(oldText);
  const newLines = splitLines(newText);
  const normalize = (line) => {
    const stripped = ignoreWhitespace ? line.replace(WHITESPACE, '') : line;
    return ignoreCase ? stripped.toLowerCase() : stripped;
  };

  // Lines are compared in normalized form; rows are rebuilt from the originals by position.
  const changes = diffArrays(oldLines.map(normalize), newLines.map(normalize), { timeout });
  const timedOut = changes === undefined;
  const rows = timedOut
    ? replaceAll(oldLines, newLines)
    : buildRows(changes, oldLines, newLines, {
      ignoreWhitespace,
      ignoreCase,
      deadline: performance.now() + INLINE_BUDGET,
    });

  let added = 0;
  let removed = 0;
  for (const row of rows) {
    if (row.type === 'equal') continue;
    if (row.left) removed += 1;
    if (row.right) added += 1;
  }
  return { rows, added, removed, identical: added === 0 && removed === 0, timedOut };
}

const lineAt = (lines, index) => ({ no: index + 1, text: lines[index], segments: null });

/** Shows the whole old text as deleted and the whole new text as inserted. */
function replaceAll(oldLines, newLines) {
  return [
    ...oldLines.map((_, index) => ({ type: 'delete', left: lineAt(oldLines, index), right: null })),
    ...newLines.map((_, index) => ({ type: 'insert', left: null, right: lineAt(newLines, index) })),
  ];
}

/** Turns jsdiff's change list into display rows, pairing deleted and inserted lines into changes. */
function buildRows(changes, oldLines, newLines, inlineOptions) {
  const rows = [];
  let oldIndex = 0;
  let newIndex = 0;
  let deleted = [];
  let inserted = [];

  // Pair a run of deleted lines with the inserted lines that follow it.
  const flush = () => {
    const pairs = Math.min(deleted.length, inserted.length);
    for (let i = 0; i < pairs; i += 1) rows.push(changeRow(deleted[i], inserted[i], inlineOptions));
    for (const left of deleted.slice(pairs)) rows.push({ type: 'delete', left, right: null });
    for (const right of inserted.slice(pairs)) rows.push({ type: 'insert', left: null, right });
    deleted = [];
    inserted = [];
  };

  for (const change of changes) {
    if (!change.added && !change.removed) flush();
    for (let i = 0; i < change.count; i += 1) {
      if (change.removed) {
        deleted.push(lineAt(oldLines, oldIndex++));
      } else if (change.added) {
        inserted.push(lineAt(newLines, newIndex++));
      } else {
        rows.push({ type: 'equal', left: lineAt(oldLines, oldIndex++), right: lineAt(newLines, newIndex++) });
      }
    }
  }
  flush();
  return rows;
}

function changeRow(left, right, inlineOptions) {
  const segments = inlineSegments(left.text, right.text, inlineOptions);
  if (segments) {
    left.segments = segments.left;
    right.segments = segments.right;
  }
  return { type: 'change', left, right };
}

/**
 * Splits a changed pair of lines into unchanged and changed segments for each side.
 * Returns null when the lines are too long, too different, or the time budget has run out.
 */
function inlineSegments(oldLine, newLine, { ignoreWhitespace, ignoreCase, deadline }) {
  const remaining = deadline - performance.now();
  if (remaining <= 0) return null;
  const oldChars = splitGraphemes(oldLine);
  const newChars = splitGraphemes(newLine);
  if (oldChars.length > INLINE_MAX_LENGTH || newChars.length > INLINE_MAX_LENGTH) return null;
  // Compare grapheme clusters so a highlight never splits an accented letter, flag, or emoji sequence.
  const comparator = ignoreCase ? (a, b) => a === b || a.toLowerCase() === b.toLowerCase() : undefined;
  const parts = diffArrays(oldChars, newChars, { comparator, timeout: Math.min(INLINE_TIMEOUT, remaining) });
  if (!parts) return null;

  const left = [];
  const right = [];
  let oldIndex = 0;
  let newIndex = 0;
  let common = 0;
  const isChange = (text) => !(ignoreWhitespace && WHITESPACE_ONLY.test(text));

  // `count` is in graphemes; slice the originals so ignoreCase keeps each side's own text.
  for (const part of parts) {
    if (part.removed) {
      const text = oldChars.slice(oldIndex, (oldIndex += part.count)).join('');
      pushSegment(left, text, isChange(text));
    } else if (part.added) {
      const text = newChars.slice(newIndex, (newIndex += part.count)).join('');
      pushSegment(right, text, isChange(text));
    } else {
      pushSegment(left, oldChars.slice(oldIndex, (oldIndex += part.count)).join(''), false);
      pushSegment(right, newChars.slice(newIndex, (newIndex += part.count)).join(''), false);
      common += part.count;
    }
  }

  const similarity = (2 * common) / (oldChars.length + newChars.length);
  return similarity < INLINE_MIN_SIMILARITY ? null : { left, right };
}

/** Appends text to the segment list, merging it into the previous segment when both share a state. */
function pushSegment(segments, text, changed) {
  const last = segments.at(-1);
  if (last && last.changed === changed) last.text += text;
  else segments.push({ text, changed });
}

/**
 * Replaces runs of unchanged rows farther than `context` rows from any change with skip rows.
 * @param {Row[]} rows
 * @param {number} [context=3]
 * @returns {Array<Row | { type: 'skip', count: number }>}
 */
export function collapseRows(rows, context = 3) {
  const visible = new Array(rows.length).fill(false);
  rows.forEach((row, index) => {
    if (row.type === 'equal') return;
    const end = Math.min(rows.length - 1, index + context);
    for (let i = Math.max(0, index - context); i <= end; i += 1) visible[i] = true;
  });

  const result = [];
  let skipped = 0;
  rows.forEach((row, index) => {
    if (!visible[index]) {
      skipped += 1;
      return;
    }
    if (skipped) result.push({ type: 'skip', count: skipped });
    skipped = 0;
    result.push(row);
  });
  if (skipped) result.push({ type: 'skip', count: skipped });
  return result;
}
