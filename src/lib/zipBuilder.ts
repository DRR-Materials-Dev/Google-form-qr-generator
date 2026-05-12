import JSZip from 'jszip'
import type { GeneratedItem } from './types'

export async function buildZip(items: GeneratedItem[]): Promise<Blob> {
  const zip = new JSZip()
  for (const item of items) {
    zip.file(item.fileName, item.pngBlob)
  }
  zip.file('index.html', buildIndexHtml(items))
  return await zip.generateAsync({ type: 'blob' })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildIndexHtml(items: GeneratedItem[]): string {
  const rows = items
    .map(
      (item) => `
    <li class="card">
      <a href="${escapeHtml(item.fileName)}" target="_blank">
        <img src="${escapeHtml(item.fileName)}" alt="${escapeHtml(item.code)}" loading="lazy" />
      </a>
      <div class="code">${escapeHtml(item.code)}</div>
      <div class="url"><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.url)}</a></div>
      <a class="dl" href="${escapeHtml(item.fileName)}" download="${escapeHtml(item.fileName)}">ダウンロード</a>
    </li>`,
    )
    .join('')

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>QRコード一覧 (${items.length}件)</title>
  <style>
    body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Hiragino Sans', Meiryo, sans-serif; margin: 16px; background: #f8fafc; color: #0f172a; }
    h1 { font-size: 18px; margin: 0 0 16px; }
    ul.grid { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
    li.card { background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; text-align: center; }
    li.card img { max-width: 100%; height: auto; display: block; margin: 0 auto 8px; }
    .code { font-weight: 600; font-size: 14px; margin-bottom: 4px; word-break: break-all; }
    .url { font-size: 11px; color: #475569; word-break: break-all; margin-bottom: 8px; }
    .url a { color: #475569; }
    a.dl { display: inline-block; font-size: 12px; padding: 4px 10px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 4px; }
    a.dl:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <h1>QRコード一覧 (${items.length}件)</h1>
  <ul class="grid">${rows}
  </ul>
</body>
</html>
`
}
