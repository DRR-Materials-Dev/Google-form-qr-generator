import { CodeGenerationError, generateFromCsv, generateFromSequence } from './codeGenerator'
import { buildLabelText, buildUrl } from './labelText'
import { renderQrWithLabel } from './qrRenderer'
import { uniquifyFileNames } from './sanitize'
import type { AppConfig, GeneratedItem } from './types'
import { PLACEHOLDER, SINGLE_QR_FILENAME } from './types'

export interface PrepareResult {
  codes: string[]
  duplicatesRemoved: number
  duplicates: string[]
}

export class PipelineError extends Error {}

export function validateUrlTemplate(template: string, useCode: boolean): void {
  if (template.trim().length === 0) {
    throw new PipelineError('URLを入力してください。')
  }
  if (useCode && !template.includes(PLACEHOLDER)) {
    throw new PipelineError(`URLに ${PLACEHOLDER} が含まれていません。`)
  }
  const sampleUrl = useCode ? buildUrl(template, 'SAMPLE') : template
  try {
    new URL(sampleUrl)
  } catch {
    throw new PipelineError('URLが有効な形式ではありません。')
  }
}

export function prepareCodes(cfg: AppConfig): PrepareResult {
  validateUrlTemplate(cfg.urlTemplate, cfg.useCode)
  if (!cfg.useCode) {
    return { codes: [''], duplicatesRemoved: 0, duplicates: [] }
  }
  try {
    if (cfg.mode === 'sequence') {
      const r = generateFromSequence(cfg.sequence)
      return { codes: r.codes, duplicatesRemoved: r.duplicatesRemoved, duplicates: r.duplicates }
    }
    const r = generateFromCsv(cfg.csv)
    return { codes: r.codes, duplicatesRemoved: r.duplicatesRemoved, duplicates: r.duplicates }
  } catch (e) {
    if (e instanceof CodeGenerationError) throw new PipelineError(e.message)
    throw e
  }
}

export interface RunCallbacks {
  onProgress?: (done: number, total: number) => void
  signal?: AbortSignal
}

export async function runPipeline(
  cfg: AppConfig,
  codes: string[],
  callbacks: RunCallbacks = {},
): Promise<GeneratedItem[]> {
  const { onProgress, signal } = callbacks
  const fileNames = cfg.useCode
    ? uniquifyFileNames(codes, 'png')
    : [SINGLE_QR_FILENAME]

  const items: GeneratedItem[] = []
  for (let i = 0; i < codes.length; i++) {
    if (signal?.aborted) throw new PipelineError('生成がキャンセルされました。')
    const code = codes[i]
    const url = cfg.useCode ? buildUrl(cfg.urlTemplate, code) : cfg.urlTemplate
    const labelText = buildLabelText(cfg.label, code, url)
    const rendered = await renderQrWithLabel(url, labelText, cfg.qr, cfg.label)
    items.push({
      code,
      url,
      labelText,
      pngBlob: rendered.blob,
      pngDataUrl: rendered.dataUrl,
      fileName: fileNames[i],
    })
    onProgress?.(i + 1, codes.length)
    if ((i & 0x1f) === 0x1f) {
      await new Promise((r) => setTimeout(r, 0))
    }
  }
  return items
}
