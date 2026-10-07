const LINE_BREAK = /\r\n|[\n\r\u0085\u2028\u2029]/u;

/** Splits text into lines. An empty string has no lines. */
export function splitLines(text) {
  return text === '' ? [] : text.split(LINE_BREAK);
}
