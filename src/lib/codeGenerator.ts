import type { CsvConfig, SequenceConfig } from './types'
import { MAX_COUNT } from './types'

export interface CodeGenerationResult {
  codes: string[]
  duplicatesRemoved: number
  duplicates: string[]
}

export class CodeGenerationError extends Error {}

export function generateFromSequence(cfg: SequenceConfig): CodeGenerationResult {
  const { prefix, start, end, digits } = cfg

  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    throw new CodeGenerationError('開始番号と終了番号は整数で入力してください。')
  }
  if (!Number.isInteger(digits) || digits < 1) {
    throw new CodeGenerationError('桁数は1以上の整数で入力してください。')
  }
  if (start < 0 || end < 0) {
    throw new CodeGenerationError('開始番号と終了番号は0以上で入力してください。')
  }
  if (end < start) {
    throw new CodeGenerationError('終了番号は開始番号以上で入力してください。')
  }

  const maxValue = Math.pow(10, digits) - 1
  if (end > maxValue) {
    throw new CodeGenerationError(
      `桁数 ${digits} では ${maxValue} までしか表現できません。終了番号 ${end} は桁あふれします。`,
    )
  }

  const count = end - start + 1
  if (count > MAX_COUNT) {
    throw new CodeGenerationError(
      `生成件数 ${count} 件は上限 ${MAX_COUNT} 件を超えています。`,
    )
  }

  const codes: string[] = []
  for (let n = start; n <= end; n++) {
    codes.push(`${prefix}${String(n).padStart(digits, '0')}`)
  }

  return { codes, duplicatesRemoved: 0, duplicates: [] }
}

export function generateFromCsv(cfg: CsvConfig): CodeGenerationResult {
  const rawLines = cfg.text.split(/\r?\n/)
  const cleaned: string[] = []
  for (const line of rawLines) {
    const trimmed = line.replace(/^﻿/, '').trim()
    if (trimmed.length === 0) continue
    const firstField = trimmed.split(',')[0].trim()
    if (firstField.length === 0) continue
    cleaned.push(firstField)
  }

  if (cleaned.length === 0) {
    throw new CodeGenerationError('コードが1件もありません。入力内容を確認してください。')
  }

  const seen = new Set<string>()
  const duplicates: string[] = []
  const unique: string[] = []
  for (const code of cleaned) {
    if (seen.has(code)) {
      duplicates.push(code)
      continue
    }
    seen.add(code)
    unique.push(code)
  }

  if (unique.length > MAX_COUNT) {
    throw new CodeGenerationError(
      `生成件数 ${unique.length} 件は上限 ${MAX_COUNT} 件を超えています。`,
    )
  }

  return {
    codes: unique,
    duplicatesRemoved: duplicates.length,
    duplicates,
  }
}
