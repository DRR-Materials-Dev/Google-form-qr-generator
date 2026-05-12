import type {
  AppConfig,
  ErrorCorrectionLevel,
  GenerationMode,
  LabelContentMode,
  PaperSize,
} from './types'

export const SETTINGS_SCHEMA = 'qrsettings'
export const SETTINGS_SCHEMA_VERSION = 1
export const SETTINGS_EXTENSION = 'qrsettings.json'

interface SerializedFile {
  $schema: typeof SETTINGS_SCHEMA
  version: number
  savedAt: string
  appVersion?: string
  config: AppConfig
}

export class SettingsParseError extends Error {}

export function serializeConfig(cfg: AppConfig, appVersion?: string): string {
  const payload: SerializedFile = {
    $schema: SETTINGS_SCHEMA,
    version: SETTINGS_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    appVersion,
    config: cfg,
  }
  return JSON.stringify(payload, null, 2)
}

export function parseConfig(text: string, defaults: AppConfig): AppConfig {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new SettingsParseError('JSONとして解析できませんでした。')
  }
  if (!isObject(raw)) {
    throw new SettingsParseError('設定ファイルの形式が不正です (オブジェクトではありません)。')
  }
  if (raw.$schema !== SETTINGS_SCHEMA) {
    throw new SettingsParseError(
      `設定ファイルのスキーマが一致しません ($schema=${String(raw.$schema)})。`,
    )
  }
  const cfgRaw = (raw as { config?: unknown }).config
  if (!isObject(cfgRaw)) {
    throw new SettingsParseError('設定ファイルに config フィールドが含まれていません。')
  }
  return mergeConfig(cfgRaw, defaults)
}

function mergeConfig(raw: Record<string, unknown>, d: AppConfig): AppConfig {
  const seq = pickObject(raw.sequence)
  const csv = pickObject(raw.csv)
  const qr = pickObject(raw.qr)
  const label = pickObject(raw.label)
  const print = pickObject(raw.print)

  return {
    urlTemplate: pickString(raw.urlTemplate, d.urlTemplate),
    mode: pickEnum(raw.mode, ['sequence', 'csv'] as const, d.mode) as GenerationMode,
    sequence: {
      prefix: pickString(seq?.prefix, d.sequence.prefix),
      start: pickNumber(seq?.start, d.sequence.start),
      end: pickNumber(seq?.end, d.sequence.end),
      digits: pickNumber(seq?.digits, d.sequence.digits),
    },
    csv: {
      text: pickString(csv?.text, d.csv.text),
    },
    qr: {
      size: pickNumber(qr?.size, d.qr.size),
      errorCorrectionLevel: pickEnum(
        qr?.errorCorrectionLevel,
        ['L', 'M', 'Q', 'H'] as const,
        d.qr.errorCorrectionLevel,
      ) as ErrorCorrectionLevel,
    },
    label: {
      enabled: pickBoolean(label?.enabled, d.label.enabled),
      contentMode: pickEnum(
        label?.contentMode,
        ['code', 'url', 'text', 'template'] as const,
        d.label.contentMode,
      ) as LabelContentMode,
      customText: pickString(label?.customText, d.label.customText),
      template: pickString(label?.template, d.label.template),
      fontSize: pickNumber(label?.fontSize, d.label.fontSize),
      fontColor: pickString(label?.fontColor, d.label.fontColor),
      fontFamily: pickString(label?.fontFamily, d.label.fontFamily),
    },
    print: {
      paperSize: pickEnum(
        print?.paperSize,
        ['A4', 'A5', 'B4', 'B5', 'Letter', 'Legal'] as const,
        d.print.paperSize,
      ) as PaperSize,
      qrScale: pickNumber(print?.qrScale, d.print.qrScale),
      qrGapRight: pickNumber(print?.qrGapRight, d.print.qrGapRight),
      qrGapBottom: pickNumber(print?.qrGapBottom, d.print.qrGapBottom),
      pageMarginTop: pickNumber(print?.pageMarginTop, d.print.pageMarginTop),
      pageMarginRight: pickNumber(print?.pageMarginRight, d.print.pageMarginRight),
      pageMarginBottom: pickNumber(print?.pageMarginBottom, d.print.pageMarginBottom),
      pageMarginLeft: pickNumber(print?.pageMarginLeft, d.print.pageMarginLeft),
      showCodeText: pickBoolean(print?.showCodeText, d.print.showCodeText),
      showUrlText: pickBoolean(print?.showUrlText, d.print.showUrlText),
      showCutGuideBorder: pickBoolean(print?.showCutGuideBorder, d.print.showCutGuideBorder),
    },
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function pickObject(v: unknown): Record<string, unknown> | undefined {
  return isObject(v) ? v : undefined
}

function pickString(v: unknown, fallback: string): string {
  return typeof v === 'string' ? v : fallback
}

function pickNumber(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function pickBoolean(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback
}

function pickEnum<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback
}
