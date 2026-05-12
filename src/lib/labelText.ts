import type { LabelConfig } from './types'

export function buildLabelText(
  cfg: LabelConfig,
  code: string,
  url: string,
): string {
  if (!cfg.enabled) return ''
  switch (cfg.contentMode) {
    case 'code':
      return code
    case 'url':
      return url
    case 'text':
      return cfg.customText
    case 'template':
      return cfg.template
        .replace(/\{CODE\}/g, code)
        .replace(/\{URL\}/g, url)
        .replace(/\{TEXT\}/g, cfg.customText)
    default:
      return code
  }
}

export function buildUrl(template: string, code: string): string {
  return template.replace(/\{CODE\}/g, code)
}
