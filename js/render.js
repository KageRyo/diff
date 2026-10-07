import { formatNumber, t } from './i18n.js';

export const STAT_GROUPS = {
  primary: ['words', 'characters', 'han', 'englishWords', 'latin', 'digits'],
  secondary: ['punctFull', 'punctHalf', 'spaceHalf', 'spaceFull', 'newlines', 'emoji', 'other', 'lines', 'paragraphs'],
};

export const cls = (...names) => names.filter(Boolean).join(' ');

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

export function renderEmpty(container) {
  const slate = el('div', 'ts-blankslate is-secondary diff-empty');
  slate.append(
    el('span', 'ts-icon is-code-compare-icon'),
    el('div', 'header', t('diff.emptyTitle')),
    el('div', 'description', t('diff.emptyDescription')),
  );
  container.replaceChildren(slate);
}

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

function lineCells(line, state, side) {
  if (!line) return [el('td', cls('diff-number', 'is-empty', side)), el('td', 'diff-text is-empty')];
  return [el('td', cls('diff-number', state, side), String(line.no)), textCell(line, state)];
}

function textCell(line, state) {
  const cell = el('td', cls('diff-text', state));
  if (line.segments) {
    cell.append(...line.segments.map((s) => (s.changed ? el('mark', '', s.text) : document.createTextNode(s.text))));
  } else {
    cell.textContent = line.text;
  }
  return cell;
}

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
