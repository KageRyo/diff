const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/** Splits text into user-perceived characters (grapheme clusters). */
export function splitGraphemes(text) {
  return Array.from(segmenter.segment(text), (part) => part.segment);
}
