import { countText } from './stats.js';
import { collapseRows, computeDiff } from './diff.js';
import { renderDiff, renderEmpty, renderStats, renderSummary } from './render.js';
import { applyI18n, setLang, t } from './i18n.js';

const STORAGE_KEY = 'diff:settings';
const THEMES = ['auto', 'light', 'dark'];
const THEME_ICONS = { auto: 'is-circle-half-stroke-icon', light: 'is-sun-icon', dark: 'is-moon-icon' };
const DEFAULT_SETTINGS = {
  includeHalfSpace: true,
  includeFullSpace: true,
  includeNewline: false,
  wordsIncludePunct: false,
  view: 'split',
  ignoreWhitespace: false,
  ignoreCase: false,
  collapse: false,
  theme: 'auto',
};
const CHOICES = { theme: THEMES, view: ['split', 'unified'] };

const settings = { ...DEFAULT_SETTINGS, ...loadSettings() };
const inputs = { left: document.getElementById('left-input'), right: document.getElementById('right-input') };
const statsPanels = { left: document.getElementById('left-stats'), right: document.getElementById('right-stats') };
const themeButton = document.getElementById('theme-toggle');
const diffSummary = document.getElementById('diff-summary');
const diffOutput = document.getElementById('diff-output');
const viewButtons = document.querySelectorAll('[data-view]');

/** Reads saved settings, keeping only known keys whose values have the expected type. */
function loadSettings() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
  const valid = {};
  for (const [key, fallback] of Object.entries(DEFAULT_SETTINGS)) {
    const value = saved?.[key];
    if (typeof value !== typeof fallback) continue;
    if (CHOICES[key] && !CHOICES[key].includes(value)) continue;
    valid[key] = value;
  }
  return valid;
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage can be unavailable (private mode, blocked cookies); settings then last for this visit.
  }
}

function update() {
  const left = inputs.left.value;
  const right = inputs.right.value;
  const leftStats = countText(left, settings);
  renderStats(statsPanels.left, leftStats);
  renderStats(statsPanels.right, countText(right, settings), leftStats);

  if (left === '' && right === '') {
    diffSummary.replaceChildren();
    renderEmpty(diffOutput);
    return;
  }
  const result = computeDiff(left, right, settings);
  renderSummary(diffSummary, result);
  renderDiff(diffOutput, settings.collapse ? collapseRows(result.rows) : result.rows, settings.view);
}

let pending;
function scheduleUpdate() {
  clearTimeout(pending);
  pending = setTimeout(update, 150);
}

function applyTheme() {
  document.body.classList.toggle('is-light', settings.theme === 'light');
  document.body.classList.toggle('is-dark', settings.theme === 'dark');
  themeButton.querySelector('.ts-icon').className = `ts-icon ${THEME_ICONS[settings.theme]}`;
  const label = t('theme.toggle', { theme: t(`theme.${settings.theme}`) });
  themeButton.setAttribute('aria-label', label);
  themeButton.title = label;
}

function applyView() {
  for (const button of viewButtons) {
    const active = button.dataset.view === settings.view;
    button.classList.toggle('is-secondary', !active);
    button.setAttribute('aria-pressed', String(active));
  }
}

for (const button of viewButtons) {
  button.addEventListener('click', () => {
    settings.view = button.dataset.view;
    saveSettings();
    applyView();
    update();
  });
}

for (const checkbox of document.querySelectorAll('input[data-setting]')) {
  const key = checkbox.dataset.setting;
  checkbox.checked = settings[key];
  checkbox.addEventListener('change', () => {
    settings[key] = checkbox.checked;
    saveSettings();
    update();
  });
}

for (const input of Object.values(inputs)) input.addEventListener('input', scheduleUpdate);

for (const button of document.querySelectorAll('[data-clear]')) {
  button.addEventListener('click', () => {
    const input = inputs[button.dataset.clear];
    input.value = '';
    input.focus();
    update();
  });
}

document.getElementById('swap').addEventListener('click', () => {
  [inputs.left.value, inputs.right.value] = [inputs.right.value, inputs.left.value];
  update();
});

document.getElementById('clear-all').addEventListener('click', () => {
  inputs.left.value = '';
  inputs.right.value = '';
  inputs.left.focus();
  update();
});

themeButton.addEventListener('click', () => {
  settings.theme = THEMES[(THEMES.indexOf(settings.theme) + 1) % THEMES.length];
  saveSettings();
  applyTheme();
});

setLang('zh-TW');
applyI18n();
applyTheme();
applyView();
update();
