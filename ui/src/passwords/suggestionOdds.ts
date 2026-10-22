import type { PasswordEntry } from './model'

export const MIN_CHANCE = 5

export interface ChanceEntry {
  entry: PasswordEntry
  chance: number
}

export interface Suggestion {
  list: ChanceEntry[]
  winnerIndex: number
  roll: number
}

export function computeChances(entries: PasswordEntry[], now = Date.now()): ChanceEntry[] {
  const count = entries.length
  if (count === 0) return []
  if (count * MIN_CHANCE >= 100) {
    return entries.map((entry) => ({ entry, chance: 100 / count }))
  }

  const ages = entries.map((entry) => Math.max(0, now - entry.passwordChangedAt.getTime()))
  const chances = new Array<number>(count).fill(0)
  const floored = new Set<number>()

  for (;;) {
    const free = entries.map((_, index) => index).filter((index) => !floored.has(index))
    const budget = 100 - floored.size * MIN_CHANCE
    const total = free.reduce((sum, index) => sum + ages[index], 0)
    let changed = false
    for (const index of free) {
      chances[index] = total > 0 ? (ages[index] / total) * budget : budget / free.length
      if (chances[index] < MIN_CHANCE) {
        floored.add(index)
        changed = true
      }
    }
    for (const index of floored) chances[index] = MIN_CHANCE
    if (!changed) break
  }

  return entries
    .map((entry, index) => ({ entry, chance: chances[index] }))
    .sort((a, b) => a.chance - b.chance)
}

export function pickSuggestion(entries: PasswordEntry[]): Suggestion {
  const list = computeChances(entries)
  const roll = Math.floor(Math.random() * 100) + 1
  let cumulative = 0
  for (let index = 0; index < list.length; index++) {
    cumulative += list[index].chance
    if (roll <= cumulative) return { list, winnerIndex: index, roll }
  }
  return { list, winnerIndex: list.length - 1, roll }
}
