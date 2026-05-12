export type GenerationMode = 'sequence' | 'csv'

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

export type LabelContentMode = 'code' | 'url' | 'text' | 'template'

export interface SequenceConfig {
  prefix: string
  start: number
  end: number
  digits: number
}

export interface CsvConfig {
  text: string
}

export interface QrConfig {
  size: number
  errorCorrectionLevel: ErrorCorrectionLevel
}

export interface LabelConfig {
  enabled: boolean
  contentMode: LabelContentMode
  customText: string
  template: string
  fontSize: number
  fontColor: string
  fontFamily: string
}

export type PaperSize = 'A4' | 'A5' | 'B4' | 'B5' | 'Letter' | 'Legal'

export interface PrintConfig {
  paperSize: PaperSize
  qrScale: number
  qrGapRight: number
  qrGapBottom: number
  pageMarginTop: number
  pageMarginRight: number
  pageMarginBottom: number
  pageMarginLeft: number
  showCodeText: boolean
  showUrlText: boolean
  showCutGuideBorder: boolean
}

export interface AppConfig {
  urlTemplate: string
  mode: GenerationMode
  sequence: SequenceConfig
  csv: CsvConfig
  qr: QrConfig
  label: LabelConfig
  print: PrintConfig
}

export interface GeneratedItem {
  code: string
  url: string
  labelText: string
  pngBlob: Blob
  pngDataUrl: string
  fileName: string
}

export const MAX_COUNT = 5000
export const PLACEHOLDER = '{CODE}'
