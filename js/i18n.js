export const messages = {
  'zh-TW': {
    'app.title': 'Diff · 文字比對與字數統計',
    'app.tagline': '文字比對與字數統計',
    'theme.auto': '自動',
    'theme.light': '淺色',
    'theme.dark': '深色',
    'theme.toggle': '切換主題（目前：{theme}）',
    'panel.original': '原始文字',
    'panel.modified': '修改後文字',
    'panel.originalPlaceholder': '在這裡貼上原始文字…',
    'panel.modifiedPlaceholder': '在這裡貼上修改後的文字…',
    'action.clear': '清除',
    'action.swap': '交換左右',
    'action.clearAll': '全部清除',
    'options.stats': '統計選項',
    'options.includeHalfSpace': '字元數含半形空白',
    'options.includeFullSpace': '字元數含全形空白',
    'options.includeNewline': '字元數含換行',
    'options.wordsIncludePunct': '字數含標點符號',
    'stats.more': '詳細統計',
    'stats.words': '字數',
    'stats.characters': '字元數',
    'stats.han': '中文字',
    'stats.englishWords': '英文單字',
    'stats.latin': '英文字母',
    'stats.digits': '數字',
    'stats.punctFull': '全形符號',
    'stats.punctHalf': '半形符號',
    'stats.spaceHalf': '半形空白',
    'stats.spaceFull': '全形空白',
    'stats.newlines': '換行',
    'stats.emoji': 'Emoji',
    'stats.other': '其他字元',
    'stats.lines': '行數',
    'stats.paragraphs': '段落',
    'diff.view': '檢視方式',
    'diff.split': '並排',
    'diff.unified': '合併',
    'diff.ignoreWhitespace': '忽略空白',
    'diff.ignoreCase': '忽略大小寫',
    'diff.collapse': '只顯示變更（前後 3 行）',
    'diff.identical': '內容相同',
    'diff.lines': '行',
    'diff.timeout': '差異過大，已改為整段比對。',
    'diff.skipped': '⋯ {count} 行未變更',
    'diff.emptyTitle': '尚無內容',
    'diff.emptyDescription': '在上方貼上兩段文字，這裡會即時顯示差異。',
    'lang.other': 'English',
    'lang.toggle': '切換語言',
    'footer.privacy': '所有處理都在你的瀏覽器中完成，文字不會上傳或保存。',
  },
  en: {
    'app.title': 'Diff · Text Compare & Word Count',
    'app.tagline': 'Compare texts and count words',
    'theme.auto': 'Auto',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.toggle': 'Switch theme (current: {theme})',
    'panel.original': 'Original',
    'panel.modified': 'Modified',
    'panel.originalPlaceholder': 'Paste the original text here…',
    'panel.modifiedPlaceholder': 'Paste the modified text here…',
    'action.clear': 'Clear',
    'action.swap': 'Swap sides',
    'action.clearAll': 'Clear all',
    'options.stats': 'Statistics',
    'options.includeHalfSpace': 'Count half-width spaces',
    'options.includeFullSpace': 'Count full-width spaces',
    'options.includeNewline': 'Count line breaks',
    'options.wordsIncludePunct': 'Count punctuation as words',
    'stats.more': 'More statistics',
    'stats.words': 'Words',
    'stats.characters': 'Characters',
    'stats.han': 'Chinese characters',
    'stats.englishWords': 'English words',
    'stats.latin': 'Latin letters',
    'stats.digits': 'Digits',
    'stats.punctFull': 'Full-width symbols',
    'stats.punctHalf': 'Half-width symbols',
    'stats.spaceHalf': 'Half-width spaces',
    'stats.spaceFull': 'Full-width spaces',
    'stats.newlines': 'Line breaks',
    'stats.emoji': 'Emoji',
    'stats.other': 'Other characters',
    'stats.lines': 'Lines',
    'stats.paragraphs': 'Paragraphs',
    'diff.view': 'View',
    'diff.split': 'Split',
    'diff.unified': 'Unified',
    'diff.ignoreWhitespace': 'Ignore whitespace',
    'diff.ignoreCase': 'Ignore case',
    'diff.collapse': 'Changes only (3 lines of context)',
    'diff.identical': 'No differences',
    'diff.lines': 'lines',
    'diff.timeout': 'The texts differ too much; showing a full replacement.',
    'diff.skipped': '⋯ {count} unchanged lines',
    'diff.emptyTitle': 'Nothing to compare yet',
    'diff.emptyDescription': 'Paste two texts above to see their differences instantly.',
    'lang.other': '中文',
    'lang.toggle': 'Switch language',
    'footer.privacy': 'Everything runs in your browser. Your text is never uploaded or stored.',
  },
};

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
