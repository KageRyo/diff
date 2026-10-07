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
