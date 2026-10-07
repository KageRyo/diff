# Diff

[正體中文](README_TW.md) · [Demo](https://kageryo.github.io/diff/)

Compare two texts side by side with git-style highlighting, and count words, characters, Chinese characters, English words, digits, symbols, and whitespace as you type. Everything runs in your browser: your text is never uploaded or stored.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tocas UI](https://img.shields.io/badge/Tocas_UI-5.7-1b1c1d)](https://tocas-ui.com/)
[![jsdiff](https://img.shields.io/badge/jsdiff-9.0-cb3837?logo=npm&logoColor=white)](https://github.com/kpdecker/jsdiff)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES_modules-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Modules)
[![Pages](https://github.com/KageRyo/diff/actions/workflows/pages.yml/badge.svg)](https://github.com/KageRyo/diff/actions/workflows/pages.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![GitHub stars](https://img.shields.io/github/stars/KageRyo/diff?style=flat)](https://github.com/KageRyo/diff/stargazers)
[![Last commit](https://img.shields.io/github/last-commit/KageRyo/diff)](https://github.com/KageRyo/diff/commits)

[![Diff comparing two Traditional Chinese paragraphs with line and character highlights and statistics for each side](docs/images/screenshot.png)](https://kageryo.github.io/diff/)

## At a glance

| Feature | Behavior |
| --- | --- |
| Live diff | Line-by-line comparison with character-level highlights inside changed lines, updated as you type |
| Views | Split (side by side) or unified (git style), with an option to show only changes plus 3 lines of context |
| Diff options | Ignore whitespace (half-width and full-width) and ignore case |
| Statistics | Words, characters, Chinese characters, English words, Latin letters, digits, symbols, spaces, line breaks, emoji, lines, and paragraphs for each side, with the difference between sides |
| Counting options | Choose whether half-width spaces, full-width spaces, and line breaks count as characters, and whether punctuation counts as words |
| Interface | Traditional Chinese and English, automatic, light, and dark themes, and a responsive layout |
| Privacy | No server and no upload; only your settings are saved in the browser |

## How counting works

Text is split into user-perceived characters (grapheme clusters), so an emoji sequence such as 👨‍👩‍👧 or an accented letter counts as one character. Every character belongs to exactly one category:

| Category | Includes |
| --- | --- |
| Chinese characters | Han script (`\p{Script=Han}`) |
| Latin letters | Latin script, including full-width letters such as `Ａ` and accented letters |
| Digits | Decimal digits, including full-width digits such as `０` |
| Half-width symbols | ASCII punctuation and symbols such as `, . ! ? $` |
| Full-width symbols | Other punctuation and symbols such as `，。！「」©` |
| Half-width spaces | Spaces, tabs, and other whitespace except U+3000 |
| Full-width spaces | The ideographic space (U+3000) |
| Line breaks | LF, CR, CRLF (counted once), U+0085, U+2028, and U+2029 |
| Emoji | Characters shown as emoji, including keycaps and ZWJ sequences |
| Other characters | Everything else, such as kana, Hangul, and Cyrillic |

- **Characters** is the number of characters minus the whitespace categories you exclude. By default, half-width and full-width spaces are counted and line breaks are not.
- **Words** follows the word-processor convention: each Chinese character or kana counts as one word, and each run of letters or digits counts as one word. Apostrophes, hyphens, and underscores inside a run (`don't`, `well-known`, `snake_case`) and periods or commas between digits (`3.14`, `1,000`) do not split it. You can also count each punctuation mark as a word.
- **English words** counts the runs that contain at least one Latin letter.
- **Lines** counts lines separated by line breaks, and **paragraphs** counts lines that contain anything other than whitespace.

## Usage

1. Open the [demo](https://kageryo.github.io/diff/).
2. Paste the original text on the left and the modified text on the right.
3. Read the differences below the editors, and switch between **Split** and **Unified** views.
4. Adjust the statistics and diff options; your choices are remembered on this device.

The diff compares lines first, then highlights the characters that changed within each modified line. Lines that are too different are highlighted as a whole. If the texts are so different that the comparison takes longer than 2 seconds, Diff shows the whole text as replaced.

## Development

You need Node.js 22 or newer. There is no build step: the page loads Tocas UI from cdnjs, and an import map in `index.html` loads jsdiff from `node_modules`, so install the dependencies before you serve the page.

```bash
git clone https://github.com/KageRyo/diff.git
cd diff
npm install
npm start
```

Open `http://localhost:8080`.

```bash
npm test                 # unit tests for statistics, diff, translations, and the import map
npm run browser:install  # download Chromium for Playwright (once)
npm run test:browser     # browser smoke test
npm run screenshot       # regenerate docs/images/screenshot.png
```

| Path | Purpose |
| --- | --- |
| `js/stats.js` | Character classification and word counting |
| `js/diff.js` | Line diff, inline highlights, and context collapsing |
| `js/render.js` | DOM rendering for statistics and diffs |
| `js/i18n.js` | Traditional Chinese and English strings |
| `js/app.js` | Events, settings, theme, and language |
| `scripts/` | Local server, browser test, and screenshot tools |

The browser and the unit tests use the same jsdiff files from `node_modules`, so upgrading jsdiff only takes `npm install --save-exact diff@<version>`.

## Deployment

The [Pages workflow](.github/workflows/pages.yml) runs the unit and browser tests on every push and pull request, and deploys the static files to GitHub Pages from `main`. To deploy a fork, open **Settings → Pages**, select **GitHub Actions** as the source, and push to `main`.

Diff is a static site, so you can also host it on any static web server. After `npm install`, publish `index.html`, `favicon.svg`, `css/`, `js/`, and `node_modules/diff/libesm/` together with `node_modules/diff/LICENSE`.

## Contributing

Bug reports, ideas, and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Acknowledgements

- [Tocas UI](https://tocas-ui.com/) for the interface components
- [jsdiff](https://github.com/kpdecker/jsdiff) for the diff algorithm

## License

[MIT](LICENSE) © 2026 Chien-Hsun Chang.
