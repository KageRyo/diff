const LINE_BREAK = /\r\n|[\n\r\u0085\u2028\u2029]/u;

/**
 * Splits text into lines on LF, CR, CRLF, U+0085, U+2028, and U+2029. An empty string has no lines.
 * @param {string} text
 * @returns {string[]}
 */
export function splitLines(text) {
  return text === '' ? [] : text.split(LINE_BREAK);
}
