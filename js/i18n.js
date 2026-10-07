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
    'footer.privacy': '所有處理都在你的瀏覽器中完成，文字不會上傳或保存。',
  },
};

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
