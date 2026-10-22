import type { PasswordEntry } from './model'

const SEARCHABLE_FIELDS = ['title', 'note', 'url'] as const

const COMBINING_MARK_RANGES: [number, number][] = [
  [0x0300, 0x036f],
  [0x1ab0, 0x1aff],
  [0x1dc0, 0x1dff],
  [0x20d0, 0x20ff],
  [0xfe20, 0xfe2f]
]

function isCombiningMark(char: string) {
  const code = char.codePointAt(0) ?? 0
  return COMBINING_MARK_RANGES.some(([from, to]) => code >= from && code <= to)
}

function isWhitespace(char: string) {
  return char.trim() === ''
}

function normalize(value: string) {
  let result = ''
  for (const char of value.toLocaleLowerCase().normalize('NFKD')) {
    if (!isCombiningMark(char)) result += char
  }
  return result
}

function tokenize(value: string) {
  const tokens: string[] = []
  let current = ''
  for (const char of value) {
    if (isWhitespace(char)) {
      if (current) tokens.push(current)
      current = ''
    } else {
      current += char
    }
  }
  if (current) tokens.push(current)
  return tokens
}

export function searchPasswords(rows: PasswordEntry[], query: string): PasswordEntry[] {
  const tokens = tokenize(normalize(query))
  if (tokens.length === 0) return rows

  return rows.filter((row) => {
    const haystack = SEARCHABLE_FIELDS.map((field) => normalize(row[field])).join('\n')
    return tokens.every((token) => haystack.includes(token))
  })
}
