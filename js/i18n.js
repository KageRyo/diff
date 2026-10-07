import en from './locales/en.js';
import zhTW from './locales/zh-TW.js';

export const messages = { 'zh-TW': zhTW, en };

export const LANGUAGES = Object.keys(messages);

let current = 'zh-TW';

export function setLang(lang) {
  current = Object.hasOwn(messages, lang) ? lang : 'zh-TW';
  document.documentElement.lang = current === 'zh-TW' ? 'zh-Hant-TW' : current;
}

export const getLang = () => current;

export function t(key, params = {}) {
  const template = messages[current][key] ?? messages['zh-TW'][key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ''));
}

export function applyI18n(root = document) {
  for (const node of root.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
  for (const node of root.querySelectorAll('[data-i18n-placeholder]')) node.placeholder = t(node.dataset.i18nPlaceholder);
  for (const node of root.querySelectorAll('[data-i18n-aria-label]')) node.setAttribute('aria-label', t(node.dataset.i18nAriaLabel));
  document.title = t('app.title');
}

export function formatNumber(value) {
  return new Intl.NumberFormat(current).format(value);
}
