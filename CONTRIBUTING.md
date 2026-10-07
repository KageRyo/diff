# Contributing

[English](#english) · [正體中文](#正體中文)

## English

Thank you for helping improve Diff! Bug reports, ideas, translations, and pull requests are all welcome.

### Reporting issues

- Use the issue templates for [bug reports](https://github.com/KageRyo/diff/issues/new?template=bug_report.yml) and [feature requests](https://github.com/KageRyo/diff/issues/new?template=feature_request.yml).
- For counting or diff problems, include a minimal sample text, the options you enabled, and the result you expected.
- Do not paste private or sensitive text.

### Development setup

You need Node.js 22 or newer.

```bash
npm install
npm start                # http://localhost:8080
npm test                 # unit tests
npm run browser:install  # once
npm run test:browser     # browser smoke test
```

There is no build step. Keep `js/stats.js` and `js/diff.js` free of DOM access so they stay testable with `node:test`, and write user text to the page only through `textContent`.

### Making changes

1. Fork the repository and create a branch from `main`.
2. Add or update tests for behavior changes.
3. When you change interface text, update both `zh-TW` and `en` in `js/i18n.js`.
4. When you change behavior, update both `README.md` and `README_TW.md`.
5. Make sure `npm test` and `npm run test:browser` pass.
6. Open a pull request and describe what changed and why.

### Commit messages

This project follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```text
<type>(<optional scope>): <description>
```

Common types are `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, and `chore`. Common scopes are `stats`, `diff`, `ui`, and `i18n`. For example:

```text
fix(stats): count full-width digits as digits
feat(diff): add a word-level highlight option
```

## 正體中文

感謝你協助改善 Diff！歡迎回報問題、提出想法、協助翻譯或送出 pull request。

### 回報問題

- 請使用 [Bug 回報](https://github.com/KageRyo/diff/issues/new?template=bug_report.yml) 與 [功能建議](https://github.com/KageRyo/diff/issues/new?template=feature_request.yml) 範本。
- 統計或比對結果有誤時，請附上最小的範例文字、勾選的選項，以及你預期的結果。
- 請勿貼上私人或敏感內容。

### 開發環境

需要 Node.js 22 以上。

```bash
npm install
npm start                # http://localhost:8080
npm test                 # 單元測試
npm run browser:install  # 只需執行一次
npm run test:browser     # 瀏覽器煙霧測試
```

本專案不需要 build。請讓 `js/stats.js` 與 `js/diff.js` 保持不存取 DOM，才能用 `node:test` 測試；使用者文字一律透過 `textContent` 寫入頁面。

### 修改流程

1. Fork 本專案，從 `main` 建立分支。
2. 行為變更請新增或更新測試。
3. 修改介面文字時，請同時更新 `js/i18n.js` 的 `zh-TW` 與 `en`。
4. 修改行為時，請同時更新 `README.md` 與 `README_TW.md`。
5. 確認 `npm test` 與 `npm run test:browser` 通過。
6. 送出 pull request，說明改了什麼以及原因。

### Commit 訊息

本專案遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hant/v1.0.0/)：

```text
<type>(<scope，可省略>): <description>
```

常用 type 有 `feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`build`、`ci`、`chore`；常用 scope 有 `stats`、`diff`、`ui`、`i18n`。例如：

```text
fix(stats): count full-width digits as digits
feat(diff): add a word-level highlight option
```
