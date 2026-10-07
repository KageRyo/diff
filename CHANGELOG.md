# Changelog

## 0.1.0

First tagged release of Diff.

### Comparison

- Live line-by-line diff with highlights for the characters that changed inside each modified line. Highlights cover whole grapheme clusters, so accented letters, flags, and emoji sequences are never split.
- Split and unified views, options to ignore whitespace (half-width and full-width) and case, and an option to show only changes with 3 lines of context.
- Time limits that keep the page responsive: the line comparison falls back to a whole-text replacement after 2 seconds, and inline highlights share a half-second budget.

### Statistics

- Words, characters, Chinese characters, English words, Latin letters, digits, half-width and full-width symbols and spaces, line breaks, emoji, other characters, lines, and paragraphs for each side, with the difference between the sides.
- Options to count half-width spaces, full-width spaces, and line breaks as characters, and punctuation marks as words.

### Interface

- Traditional Chinese and English, automatic, light, and dark themes, keyboard focus indicators, and a responsive layout built with Tocas UI 5.7.
- Settings are saved in the browser; text is never uploaded or stored.

### Project

- jsdiff 9.0.0 is served from the npm package, so the page loads no third-party scripts.
- Unit tests with `node:test`, a Playwright browser smoke test, and a GitHub Actions workflow that runs both and deploys to GitHub Pages.
- English and Traditional Chinese READMEs, a contributing guide, and issue and pull request templates.
