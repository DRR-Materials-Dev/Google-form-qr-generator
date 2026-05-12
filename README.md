# Google Form QR 大量生成ツール

Google フォームの事前入力URLに対して、コード（連番 または CSV）を差し込んだ大量のURL＋QRコードを一括生成するブラウザ完結のWebアプリです。

**▶ 公開ページ (GitHub Pages): <https://drr-materials-dev.github.io/Google-form-qr-generator/>**

## 概要

- 事前入力URLの `{CODE}` プレースホルダを置換した複数URLを生成
- 各URLに対応するQRコード(PNG)を、ラベル文字列を画像に焼き込んだ上で出力
- 一覧プレビュー / ZIPダウンロード / A4印刷レイアウトに対応
- ブラウザ内のみで完結。サーバー送信なし

主用途: イベント受付 / 卓番号管理 / ゲームセッション管理 / 避難所区画管理 / 来場者識別 など

## 使い方

1. URLテンプレートに `{CODE}` を含めて入力 (例: `https://docs.google.com/forms/d/XXXXX/viewform?entry.2096451574={CODE}`)
2. コード生成方式を選択
   - **連番生成**: Prefix / 開始番号 / 終了番号 / 桁数 を指定 (例: `GAME01` ～ `GAME50`)
   - **CSV / リスト入力**: 1行1コードでテキスト入力、または `.csv` / `.txt` ファイルをアップロード
3. QRサイズ・誤り訂正レベル・ラベル表示設定を調整
4. 「QRコード生成」ボタンで一括生成
5. 「ZIPダウンロード」または「印刷」で出力

ZIPには各PNGファイルと、ブラウザで開ける一覧 `index.html` が同梱されます。

## 動作要件

- 最新版の Chrome / Edge / Firefox / Safari
- 上限: 5000件

## ローカル開発

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # dist/ にビルド
npm run preview # ビルド結果のローカル確認
```

Node.js 20 以上を推奨。

## デプロイ

`main` ブランチへの push で GitHub Actions が自動的に GitHub Pages へデプロイします (`.github/workflows/deploy.yml`)。

Vite の `base` は `/Google-form-qr-generator/` に設定されています (`vite.config.ts`)。リポジトリ名を変更する場合は併せて更新してください。

## 技術スタック

- React 19 / TypeScript / Vite
- Tailwind CSS (ダークモード class 戦略)
- [qrcode](https://github.com/soldair/node-qrcode) (QRコード生成)
- [JSZip](https://github.com/Stuk/jszip) (ZIPアーカイブ生成)

## ライセンス

本ツール本体は **MIT License** です。

```text
MIT License

Copyright (c) 2026 防災教材開発G

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 使用ライブラリのライセンス

本ツールは以下のオープンソースライブラリを利用しています。各ライブラリのライセンス全文は配布物の `node_modules/<package>/LICENSE` を参照してください。

| ライブラリ | ライセンス | リポジトリ |
| --- | --- | --- |
| React | MIT | <https://github.com/facebook/react> |
| React DOM | MIT | <https://github.com/facebook/react> |
| Vite | MIT | <https://github.com/vitejs/vite> |
| @vitejs/plugin-react | MIT | <https://github.com/vitejs/vite-plugin-react> |
| TypeScript | Apache-2.0 | <https://github.com/microsoft/TypeScript> |
| qrcode | MIT | <https://github.com/soldair/node-qrcode> |
| @types/qrcode | MIT | <https://github.com/DefinitelyTyped/DefinitelyTyped> |
| JSZip | MIT or GPL-3.0 (dual) | <https://github.com/Stuk/jszip> |
| Tailwind CSS | MIT | <https://github.com/tailwindlabs/tailwindcss> |
| PostCSS | MIT | <https://github.com/postcss/postcss> |
| Autoprefixer | MIT | <https://github.com/postcss/autoprefixer> |
| ESLint | MIT | <https://github.com/eslint/eslint> |

各依存ライブラリの著作権は、それぞれの権利者に帰属します。

---

Copyright (c) 2026 防災教材開発G
