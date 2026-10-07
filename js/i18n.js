/**
 * @file Interface language: tracks the active locale, translates elements marked with
 * `data-i18n*` attributes, and formats numbers. Strings live in ./locales/, one file per language.
 */

import en from './locales/en.js';
import zhTW from './locales/zh-TW.js';

export const messages = { 'zh-TW': zhTW, en };

export const LANGUAGES = Object.keys(messages);

// Traditional Chinese is the reference language and the fallback for missing keys.
let current = 'zh-TW';

/**
 * Switches the active language and updates `<html lang>`. Unknown languages fall back to Traditional Chinese.
 * @param {string} lang
 */
export function setLang(lang) {
  current = Object.hasOwn(messages, lang) ? lang : 'zh-TW';
  document.documentElement.lang = current === 'zh-TW' ? 'zh-Hant-TW' : current;
}

export const getLang = () => current;

/**
 * Returns the translation for `key`, filling `{name}` placeholders from `params`.
 * @param {string} key
 * @param {Record<string, string | number>} [params]
 * @returns {string}
 */
export function t(key, params = {}) {
  const template = messages[current][key] ?? messages['zh-TW'][key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ''));
}

/**
 * Translates the text, placeholder, and aria-label of every marked element under `root`, and the page title.
 * @param {ParentNode} [root]
 */
export function applyI18n(root = document) {
  for (const node of root.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
  for (const node of root.querySelectorAll('[data-i18n-placeholder]')) node.placeholder = t(node.dataset.i18nPlaceholder);
  for (const node of root.querySelectorAll('[data-i18n-aria-label]')) node.setAttribute('aria-label', t(node.dataset.i18nAriaLabel));
  document.title = t('app.title');
}

/**
 * Formats a number with the active language's digit grouping, e.g. 3,000.
 * @param {number} value
 * @returns {string}
 */
export function formatNumber(value) {
  return new Intl.NumberFormat(current).format(value);
}
