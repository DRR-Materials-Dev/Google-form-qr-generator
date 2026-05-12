const INVALID_FILENAME_CHARS = /[\\/:*?"<>|\x00-\x1f]/g

export function sanitizeFileNameStem(stem: string): string {
  const replaced = stem.replace(INVALID_FILENAME_CHARS, '_').trim()
  if (replaced.length === 0) return 'untitled'
  return replaced.replace(/^\.+/, '_')
}

export function uniquifyFileNames(stems: string[], ext: string): string[] {
  const used = new Set<string>()
  const result: string[] = []
  for (const original of stems) {
    const base = sanitizeFileNameStem(original)
    let candidate = `${base}.${ext}`
    let n = 2
    while (used.has(candidate.toLowerCase())) {
      candidate = `${base}_${n}.${ext}`
      n++
    }
    used.add(candidate.toLowerCase())
    result.push(candidate)
  }
  return result
}
