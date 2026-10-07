/**
 * @file Builds the statistics panels and the diff table. User text is only ever inserted with
 * `textContent` or text nodes, never as HTML.
 */

import { formatNumber, t } from './i18n.js';

// The statistics shown in each panel; the secondary ones sit under "More statistics".
export const STAT_GROUPS = {
  primary: ['words', 'characters', 'han', 'englishWords', 'latin', 'digits'],
  secondary: ['punctFull', 'punctHalf', 'spaceHalf', 'spaceFull', 'newlines', 'emoji', 'other', 'lines', 'paragraphs'],
};

/** Joins the truthy class names with spaces. */
export const cls = (...names) => names.filter(Boolean).join(' ');

/** Creates an element with an optional class name and text content. */
export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Renders one side's statistics; `baseline` adds the difference from the other side. */
export function renderStats(container, stats, baseline = null) {
  for (const [group, keys] of Object.entries(STAT_GROUPS)) {
    container
      .querySelector(`[data-stats="${group}"]`)
      .replaceChildren(...keys.map((key) => statItem(key, stats[key], baseline?.[key])));
  }
}

/** Builds one statistic: the number, its difference from the other side when it differs, and the label. */
function statItem(key, value, baseValue) {
  const item = el('div', 'stat');
  item.dataset.stat = key;
  const valueRow = el('div', 'stat-value');
  valueRow.append(el('span', 'stat-number', formatNumber(value)));
  if (baseValue !== undefined && value !== baseValue) {
    const delta = value - baseValue;
    const sign = delta > 0 ? '+' : '\u2212';
    valueRow.append(el('span', cls('stat-delta', delta > 0 ? 'is-positive' : 'is-negative'), `${sign}${formatNumber(Math.abs(delta))}`));
  }
  item.append(valueRow, el('div', 'stat-label', t(`stats.${key}`)));
  return item;
}

/** Shows the placeholder used while both inputs are empty. */
export function renderEmpty(container) {
  const slate = el('div', 'ts-blankslate is-secondary diff-empty');
  slate.append(
    el('span', 'ts-icon is-code-compare-icon'),
    el('div', 'header', t('diff.emptyTitle')),
    el('div', 'description', t('diff.emptyDescription')),
  );
  container.replaceChildren(slate);
}

/** Shows the added and removed line counts, or that the texts are identical. */
export function renderSummary(container, result) {
  if (result.identical) {
    container.replaceChildren(el('span', 'is-identical', t('diff.identical')));
    return;
  }
  const parts = [
    el('span', 'is-added', `+${formatNumber(result.added)}`),
    el('span', 'is-removed', `\u2212${formatNumber(result.removed)}`),
    el('span', '', t('diff.lines')),
  ];
  if (result.timedOut) parts.push(el('span', 'is-warning', t('diff.timeout')));
  container.replaceChildren(...parts);
}

/**
 * Renders diff rows as a table.
 * @param {HTMLElement} container
 * @param {Array<object>} rows Rows from computeDiff, optionally collapsed with collapseRows.
 * @param {'split' | 'unified'} view Side by side, or one column like `git diff`.
 */
export function renderDiff(container, rows, view) {
  const columns = view === 'split'
    ? ['is-number', 'is-text', 'is-number', 'is-text']
    : ['is-number', 'is-number', 'is-marker', 'is-text'];
  const colgroup = el('colgroup');
  colgroup.append(...columns.map((name) => el('col', name)));
  const body = el('tbody');
  body.append(...(view === 'split' ? rows.map(splitRow) : unifiedRows(rows)));
  const table = el('table', cls('diff-table', `is-${view}`));
  table.append(colgroup, body);
  container.replaceChildren(table);
}

/** One side-by-side row: line number and text for the old side, then for the new side. */
function splitRow(row) {
  if (row.type === 'skip') return skipRow(row.count);
  const changed = row.type !== 'equal';
  const tr = el('tr');
  tr.append(
    ...lineCells(row.left, changed && 'is-delete'),
    ...lineCells(row.right, changed && 'is-insert', 'is-right'),
  );
  return tr;
}

/** The number and text cells for one side; a side without a line gets empty, shaded cells. */
function lineCells(line, state, side) {
  if (!line) return [el('td', cls('diff-number', 'is-empty', side)), el('td', 'diff-text is-empty')];
  return [el('td', cls('diff-number', state, side), String(line.no)), textCell(line, state)];
}

/** A text cell, with changed segments wrapped in <mark> when the line has inline highlights. */
function textCell(line, state) {
  const cell = el('td', cls('diff-text', state));
  if (line.segments) {
    cell.append(...line.segments.map((s) => (s.changed ? el('mark', '', s.text) : document.createTextNode(s.text))));
  } else {
    cell.textContent = line.text;
  }
  return cell;
}

/** A full-width row standing in for unchanged lines hidden by collapseRows. */
function skipRow(count) {
  const cell = el('td', 'diff-skip', t('diff.skipped', { count: formatNumber(count) }));
  cell.colSpan = 4;
  const tr = el('tr');
  tr.append(cell);
  return tr;
}

// Like `git diff`: inside each changed block, list every deletion before the insertions.
function unifiedRows(rows) {
  const result = [];
  let deletions = [];
  let insertions = [];
  const flush = () => {
    result.push(...deletions, ...insertions);
    deletions = [];
    insertions = [];
  };
  for (const row of rows) {
    if (row.type === 'skip') {
      flush();
      result.push(skipRow(row.count));
    } else if (row.type === 'equal') {
      flush();
      result.push(unifiedRow(row.left.no, row.right.no, ' ', row.right));
    } else {
      if (row.left) deletions.push(unifiedRow(row.left.no, '', '-', row.left, 'is-delete'));
      if (row.right) insertions.push(unifiedRow('', row.right.no, '+', row.right, 'is-insert'));
    }
  }
  flush();
  return result;
}

/** One unified row: old and new line numbers, a -, +, or blank marker, and the text. */
function unifiedRow(oldNo, newNo, marker, line, state) {
  const tr = el('tr');
  tr.append(
    el('td', cls('diff-number', state), String(oldNo)),
    el('td', cls('diff-number', state), String(newNo)),
    el('td', cls('diff-marker', state), marker),
    textCell(line, state),
  );
  return tr;
}
