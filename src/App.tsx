import { useMemo, useRef, useState } from 'react'
import { useDarkMode } from './hooks/useDarkMode'
import { Alert, Button, Checkbox, Field, NumberInput, Section, Select, TextArea, TextInput } from './components/ui'
import type { AppConfig, GeneratedItem } from './lib/types'
import { MAX_COUNT, PLACEHOLDER } from './lib/types'
import { PipelineError, prepareCodes, runPipeline } from './lib/pipeline'
import { buildZip } from './lib/zipBuilder'

const DEFAULT_CONFIG: AppConfig = {
  urlTemplate: `https://docs.google.com/forms/d/XXXXX/viewform?entry.2096451574=${PLACEHOLDER}`,
  mode: 'sequence',
  sequence: { prefix: 'GAME', start: 1, end: 10, digits: 2 },
  csv: { text: 'ALPHA\nBETA\nOMEGA' },
  qr: { size: 256, errorCorrectionLevel: 'M' },
  label: {
    enabled: true,
    contentMode: 'code',
    customText: '',
    template: '{CODE}',
    fontSize: 14,
    fontColor: '#000000',
    fontFamily: 'sans-serif',
  },
  print: {
    paperSize: 'A4',
    qrScale: 100,
    qrGapRight: 8,
    qrGapBottom: 8,
    pageMarginTop: 40,
    pageMarginRight: 40,
    pageMarginBottom: 40,
    pageMarginLeft: 40,
    showCodeText: true,
    showUrlText: false,
    showCutGuideBorder: true,
  },
}

export default function App() {
  const [isDark, toggleDark] = useDarkMode()
  const [cfg, setCfg] = useState<AppConfig>(DEFAULT_CONFIG)
  const [items, setItems] = useState<GeneratedItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [running, setRunning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const previewUrl = useMemo(() => {
    const sample =
      cfg.mode === 'sequence'
        ? `${cfg.sequence.prefix}${String(cfg.sequence.start).padStart(cfg.sequence.digits, '0')}`
        : (cfg.csv.text.split(/\r?\n/).find((l) => l.trim().length > 0) ?? 'SAMPLE').trim()
    return cfg.urlTemplate.replace(/\{CODE\}/g, sample)
  }, [cfg])

  const update = <K extends keyof AppConfig>(key: K, value: AppConfig[K]) =>
    setCfg((c) => ({ ...c, [key]: value }))

  const updateSeq = (patch: Partial<AppConfig['sequence']>) =>
    setCfg((c) => ({ ...c, sequence: { ...c.sequence, ...patch } }))

  const updateQr = (patch: Partial<AppConfig['qr']>) =>
    setCfg((c) => ({ ...c, qr: { ...c.qr, ...patch } }))

  const updateLabel = (patch: Partial<AppConfig['label']>) =>
    setCfg((c) => ({ ...c, label: { ...c.label, ...patch } }))

  const updatePrint = (patch: Partial<AppConfig['print']>) =>
    setCfg((c) => ({ ...c, print: { ...c.print, ...patch } }))

  const onCsvFile = async (file: File) => {
    const text = await file.text()
    const cleaned = text.replace(/^﻿/, '')
    setCfg((c) => ({ ...c, csv: { text: cleaned } }))
  }

  const handleGenerate = async () => {
    setError(null)
    setWarning(null)
    setItems([])
    setRunning(true)
    setProgress(null)
    try {
      const prep = prepareCodes(cfg)
      if (prep.duplicatesRemoved > 0) {
        const sample = prep.duplicates.slice(0, 5).join(', ')
        const more = prep.duplicates.length > 5 ? ' …他' : ''
        setWarning(
          `重複コードを ${prep.duplicatesRemoved} 件自動排除しました (例: ${sample}${more})`,
        )
      }
      setProgress({ done: 0, total: prep.codes.length })
      const generated = await runPipeline(cfg, prep.codes, {
        onProgress: (done, total) => setProgress({ done, total }),
      })
      setItems(generated)
    } catch (e) {
      if (e instanceof PipelineError) setError(e.message)
      else if (e instanceof Error) setError(e.message)
      else setError('未知のエラーが発生しました')
    } finally {
      setRunning(false)
    }
  }

  const handleDownloadZip = async () => {
    if (items.length === 0) return
    const blob = await buildZip(items)
    triggerDownload(blob, `qrcodes_${items.length}.zip`)
  }

  const handleDownloadOne = (item: GeneratedItem) => {
    triggerDownload(item.pngBlob, item.fileName)
  }

  const printedQrWidth = Math.max(1, Math.round((cfg.qr.size * cfg.print.qrScale) / 100))

  const printStyle = `
@page {
  size: ${cfg.print.paperSize} portrait;
  margin: ${cfg.print.pageMarginTop}px ${cfg.print.pageMarginRight}px ${cfg.print.pageMarginBottom}px ${cfg.print.pageMarginLeft}px;
}
@media print {
  html, body { background: #ffffff !important; color: #000000 !important; }
  .print-grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fill, ${printedQrWidth}px) !important;
    column-gap: ${cfg.print.qrGapRight}px !important;
    row-gap: ${cfg.print.qrGapBottom}px !important;
    justify-content: start !important;
    padding: 0 !important;
    margin: 0 !important;
    list-style: none !important;
  }
  .print-grid > li {
    width: ${printedQrWidth}px !important;
    box-sizing: border-box !important;
    break-inside: avoid;
    page-break-inside: avoid;
    background: #ffffff !important;
    border: ${cfg.print.showCutGuideBorder ? '1px solid #d1d5db' : 'none'} !important;
    padding: 0 !important;
    text-align: center;
    color: #000000 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .print-grid img {
    width: 100% !important;
    height: auto !important;
    display: block;
  }
  ${cfg.print.showCodeText ? '' : '.print-grid .code { display: none !important; }'}
  ${cfg.print.showUrlText ? '' : '.print-grid .url { display: none !important; }'}
}
`

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <style>{printStyle}</style>
      <header className="no-print sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="text-base font-bold sm:text-lg">Google Form QR 大量生成ツール</h1>
          <Button variant="ghost" onClick={toggleDark} aria-label="ダークモード切替">
            {isDark ? '☀ ライト' : '🌙 ダーク'}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="no-print grid gap-4 lg:grid-cols-2">
          <Section title="1. URLテンプレート">
            <Field label="URLテンプレート" hint={`${PLACEHOLDER} の部分が各コードで置換されます。`}>
              <TextInput
                value={cfg.urlTemplate}
                onChange={(e) => update('urlTemplate', e.target.value)}
                placeholder="https://docs.google.com/forms/d/XXXXX/viewform?entry.0000000000={CODE}"
              />
            </Field>
            <div className="text-xs text-slate-600 dark:text-slate-300">
              <div>プレビュー (先頭コード):</div>
              <div className="mt-1 break-all rounded bg-slate-100 px-2 py-1 font-mono text-[11px] dark:bg-slate-700">
                {previewUrl}
              </div>
            </div>
          </Section>

          <Section title="2. コード生成">
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={cfg.mode === 'sequence'}
                  onChange={() => update('mode', 'sequence')}
                />
                連番生成
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={cfg.mode === 'csv'}
                  onChange={() => update('mode', 'csv')}
                />
                CSV / リスト入力
              </label>
            </div>

            {cfg.mode === 'sequence' ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="Prefix">
                  <TextInput value={cfg.sequence.prefix} onChange={(e) => updateSeq({ prefix: e.target.value })} />
                </Field>
                <Field label="開始番号">
                  <NumberInput value={cfg.sequence.start} onChange={(e) => updateSeq({ start: Number(e.target.value) })} min={0} />
                </Field>
                <Field label="終了番号">
                  <NumberInput value={cfg.sequence.end} onChange={(e) => updateSeq({ end: Number(e.target.value) })} min={0} />
                </Field>
                <Field label="桁数">
                  <NumberInput value={cfg.sequence.digits} onChange={(e) => updateSeq({ digits: Number(e.target.value) })} min={1} max={10} />
                </Field>
              </div>
            ) : (
              <>
                <Field label="コード一覧 (1行1コード)">
                  <TextArea
                    rows={6}
                    value={cfg.csv.text}
                    onChange={(e) => setCfg((c) => ({ ...c, csv: { text: e.target.value } }))}
                    placeholder={'ALPHA\nBETA\nOMEGA'}
                  />
                </Field>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,text/csv,text/plain"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) onCsvFile(f)
                      e.target.value = ''
                    }}
                  />
                  <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                    CSVファイル読込
                  </Button>
                  <span className="text-xs text-slate-500 dark:text-slate-400">UTF-8 / 1列目のみ使用</span>
                </div>
              </>
            )}
          </Section>

          <Section title="3. QR設定">
            <div className="grid grid-cols-2 gap-3">
              <Field label="QRサイズ (px)" hint="128〜1024">
                <NumberInput value={cfg.qr.size} min={128} max={1024} onChange={(e) => updateQr({ size: Number(e.target.value) })} />
              </Field>
              <Field label="誤り訂正レベル">
                <Select value={cfg.qr.errorCorrectionLevel} onChange={(e) => updateQr({ errorCorrectionLevel: e.target.value as AppConfig['qr']['errorCorrectionLevel'] })}>
                  <option value="L">L (約7%)</option>
                  <option value="M">M (約15%)</option>
                  <option value="Q">Q (約25%)</option>
                  <option value="H">H (約30%)</option>
                </Select>
              </Field>
            </div>
          </Section>

          <Section title="4. ラベル設定">
            <Checkbox checked={cfg.label.enabled} onChange={(v) => updateLabel({ enabled: v })}>
              ラベルを表示する (画像へ焼き込み)
            </Checkbox>
            {cfg.label.enabled && (
              <>
                <Field label="表示内容">
                  <Select value={cfg.label.contentMode} onChange={(e) => updateLabel({ contentMode: e.target.value as AppConfig['label']['contentMode'] })}>
                    <option value="code">コードのみ</option>
                    <option value="url">URL</option>
                    <option value="text">任意テキスト</option>
                    <option value="template">テンプレート (コード + テキスト)</option>
                  </Select>
                </Field>
                {(cfg.label.contentMode === 'text' || cfg.label.contentMode === 'template') && (
                  <Field label="任意テキスト">
                    <TextInput value={cfg.label.customText} onChange={(e) => updateLabel({ customText: e.target.value })} />
                  </Field>
                )}
                {cfg.label.contentMode === 'template' && (
                  <Field label="テンプレート" hint="{CODE} {TEXT} {URL} を展開します。例: '{CODE} - {TEXT}'">
                    <TextInput value={cfg.label.template} onChange={(e) => updateLabel({ template: e.target.value })} />
                  </Field>
                )}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Field label="フォントサイズ (px)">
                    <NumberInput value={cfg.label.fontSize} min={6} max={64} onChange={(e) => updateLabel({ fontSize: Number(e.target.value) })} />
                  </Field>
                  <Field label="文字色">
                    <TextInput type="color" value={cfg.label.fontColor} onChange={(e) => updateLabel({ fontColor: e.target.value })} />
                  </Field>
                  <Field label="フォント">
                    <Select value={cfg.label.fontFamily} onChange={(e) => updateLabel({ fontFamily: e.target.value })}>
                      <option value="sans-serif">sans-serif</option>
                      <option value="serif">serif</option>
                      <option value="monospace">monospace</option>
                    </Select>
                  </Field>
                </div>
              </>
            )}
          </Section>

          <Section title="5. 印刷レイアウト">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="用紙サイズ">
                <Select
                  value={cfg.print.paperSize}
                  onChange={(e) => updatePrint({ paperSize: e.target.value as AppConfig['print']['paperSize'] })}
                >
                  <option value="A4">A4 (210×297mm)</option>
                  <option value="A5">A5 (148×210mm)</option>
                  <option value="B4">B4 (257×364mm)</option>
                  <option value="B5">B5 (182×257mm)</option>
                  <option value="Letter">Letter (8.5×11in)</option>
                  <option value="Legal">Legal (8.5×14in)</option>
                </Select>
              </Field>
              <Field label="QR縮尺 (%)" hint="10〜300。QRサイズに対する比率">
                <NumberInput
                  value={cfg.print.qrScale}
                  min={10}
                  max={300}
                  step={5}
                  onChange={(e) => updatePrint({ qrScale: clamp(Number(e.target.value), 10, 300) })}
                />
              </Field>
              <Field label="印刷時QR幅 (px)" hint="QRサイズ × 縮尺 (読取専用)">
                <TextInput value={printedQrWidth} readOnly disabled />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="QR間 右マージン (px)">
                <NumberInput
                  value={cfg.print.qrGapRight}
                  min={0}
                  max={200}
                  onChange={(e) => updatePrint({ qrGapRight: Math.max(0, Number(e.target.value)) })}
                />
              </Field>
              <Field label="QR間 下マージン (px)">
                <NumberInput
                  value={cfg.print.qrGapBottom}
                  min={0}
                  max={200}
                  onChange={(e) => updatePrint({ qrGapBottom: Math.max(0, Number(e.target.value)) })}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="用紙余白 上 (px)">
                <NumberInput
                  value={cfg.print.pageMarginTop}
                  min={0}
                  max={500}
                  onChange={(e) => updatePrint({ pageMarginTop: Math.max(0, Number(e.target.value)) })}
                />
              </Field>
              <Field label="用紙余白 右 (px)">
                <NumberInput
                  value={cfg.print.pageMarginRight}
                  min={0}
                  max={500}
                  onChange={(e) => updatePrint({ pageMarginRight: Math.max(0, Number(e.target.value)) })}
                />
              </Field>
              <Field label="用紙余白 下 (px)">
                <NumberInput
                  value={cfg.print.pageMarginBottom}
                  min={0}
                  max={500}
                  onChange={(e) => updatePrint({ pageMarginBottom: Math.max(0, Number(e.target.value)) })}
                />
              </Field>
              <Field label="用紙余白 左 (px)">
                <NumberInput
                  value={cfg.print.pageMarginLeft}
                  min={0}
                  max={500}
                  onChange={(e) => updatePrint({ pageMarginLeft: Math.max(0, Number(e.target.value)) })}
                />
              </Field>
            </div>

            <div className="flex flex-wrap gap-4">
              <Checkbox
                checked={cfg.print.showCutGuideBorder}
                onChange={(v) => updatePrint({ showCutGuideBorder: v })}
              >
                切り取り用の枠線を表示 (薄い灰色)
              </Checkbox>
              <Checkbox
                checked={cfg.print.showCodeText}
                onChange={(v) => updatePrint({ showCodeText: v })}
              >
                印刷時にコード文字を画像下に表示
              </Checkbox>
              <Checkbox
                checked={cfg.print.showUrlText}
                onChange={(v) => updatePrint({ showUrlText: v })}
              >
                印刷時にURLを画像下に表示
              </Checkbox>
            </div>
          </Section>
        </div>

        <div className="no-print mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={handleGenerate} disabled={running}>
            {running ? '生成中…' : 'QRコード生成'}
          </Button>
          <Button variant="secondary" onClick={handleDownloadZip} disabled={running || items.length === 0}>
            ZIPダウンロード ({items.length}件)
          </Button>
          <Button variant="secondary" onClick={() => window.print()} disabled={items.length === 0}>
            印刷
          </Button>
          <span className="text-xs text-slate-500 dark:text-slate-400">上限: {MAX_COUNT}件</span>
        </div>

        <div className="no-print mt-4 space-y-2">
          {error && <Alert kind="error">{error}</Alert>}
          {warning && <Alert kind="warning">{warning}</Alert>}
          {running && progress && (
            <Alert kind="info">
              生成中: {progress.done} / {progress.total} 件
              <div className="mt-1 h-2 w-full overflow-hidden rounded bg-blue-100 dark:bg-blue-900">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100)}%` }}
                />
              </div>
            </Alert>
          )}
        </div>

        {items.length > 0 && (
          <div className="mt-6">
            <ul className="print-grid grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {items.map((item) => (
                <li
                  key={item.fileName}
                  className="rounded border border-slate-200 bg-white p-2 text-center dark:border-slate-700 dark:bg-slate-800"
                >
                  <img
                    src={item.pngDataUrl}
                    alt={item.code}
                    className="mx-auto block h-auto max-w-full"
                    loading="lazy"
                  />
                  <div className="code mt-1 break-all text-xs font-medium">{item.code}</div>
                  <div className="url break-all text-[10px] text-slate-500 dark:text-slate-400">
                    {item.url}
                  </div>
                  <button
                    type="button"
                    className="no-print mt-1 text-[11px] text-blue-600 hover:underline dark:text-blue-400"
                    onClick={() => handleDownloadOne(item)}
                  >
                    ダウンロード
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      <footer className="no-print mx-auto max-w-6xl px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        © 防災教材開発G — MIT License ·{' '}
        <a
          className="underline hover:text-blue-600 dark:hover:text-blue-400"
          href="https://github.com/DRR-Materials-Dev/Google-form-qr-generator"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </footer>
    </div>
  )
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min
  return Math.min(max, Math.max(min, n))
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
