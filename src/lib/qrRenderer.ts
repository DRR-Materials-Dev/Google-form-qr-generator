import QRCode from 'qrcode'
import type { LabelConfig, QrConfig } from './types'

const LABEL_MIN_HEIGHT = 40
const LABEL_PADDING_X = 8
const LABEL_PADDING_Y = 6
const LINE_HEIGHT_RATIO = 1.3

export interface RenderResult {
  blob: Blob
  dataUrl: string
  width: number
  height: number
}

export async function renderQrWithLabel(
  url: string,
  labelText: string,
  qr: QrConfig,
  label: LabelConfig,
): Promise<RenderResult> {
  const qrCanvas = document.createElement('canvas')
  await QRCode.toCanvas(qrCanvas, url, {
    width: qr.size,
    errorCorrectionLevel: qr.errorCorrectionLevel,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  })

  const showLabel = label.enabled && labelText.length > 0

  let labelLines: string[] = []
  let labelHeight = 0
  let lineHeight = 0

  if (showLabel) {
    const measureCanvas = document.createElement('canvas')
    const mctx = measureCanvas.getContext('2d')!
    mctx.font = `${label.fontSize}px ${label.fontFamily}`
    const maxTextWidth = qr.size - LABEL_PADDING_X * 2
    labelLines = wrapText(mctx, labelText, maxTextWidth)
    lineHeight = Math.ceil(label.fontSize * LINE_HEIGHT_RATIO)
    const contentHeight = lineHeight * labelLines.length + LABEL_PADDING_Y * 2
    labelHeight = Math.max(LABEL_MIN_HEIGHT, contentHeight)
  }

  const width = qr.size
  const height = qr.size + labelHeight

  const out = document.createElement('canvas')
  out.width = width
  out.height = height
  const ctx = out.getContext('2d')!

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  ctx.drawImage(qrCanvas, 0, 0)

  if (showLabel) {
    ctx.fillStyle = label.fontColor
    ctx.font = `${label.fontSize}px ${label.fontFamily}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    const totalTextHeight = lineHeight * labelLines.length
    const labelAreaTop = qr.size
    const startY = labelAreaTop + (labelHeight - totalTextHeight) / 2
    const centerX = width / 2
    for (let i = 0; i < labelLines.length; i++) {
      ctx.fillText(labelLines[i], centerX, startY + i * lineHeight)
    }
  }

  const blob = await canvasToBlob(out)
  const dataUrl = out.toDataURL('image/png')
  return { blob, dataUrl, width, height }
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b)
      else reject(new Error('Canvas to Blob 変換に失敗しました'))
    }, 'image/png')
  })
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  if (maxWidth <= 0) return [text]
  const lines: string[] = []
  for (const rawLine of text.split(/\r?\n/)) {
    if (rawLine.length === 0) {
      lines.push('')
      continue
    }
    let current = ''
    for (const ch of Array.from(rawLine)) {
      const test = current + ch
      const w = ctx.measureText(test).width
      if (w > maxWidth && current.length > 0) {
        lines.push(current)
        current = ch
      } else {
        current = test
      }
    }
    if (current.length > 0) lines.push(current)
  }
  return lines.length > 0 ? lines : ['']
}
