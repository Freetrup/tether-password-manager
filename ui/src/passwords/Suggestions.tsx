import type { StoredPassword } from './model'

const STALE_AFTER_MONTHS = 3

function countReusedPasswords(passwords: StoredPassword[]) {
  const usage = new Map<string, number>()
  for (const { password } of passwords) usage.set(password, (usage.get(password) ?? 0) + 1)
  let reused = 0
  for (const count of usage.values()) if (count > 1) reused += count
  return reused
}

function countStalePasswords(passwords: StoredPassword[], months: number) {
  const threshold = new Date()
  threshold.setMonth(threshold.getMonth() - months)
  const limit = threshold.getTime()
  return passwords.filter(({ passwordChangedAt }) => passwordChangedAt < limit).length
}

type SuggestionStatus = 'success' | 'danger'

interface Suggestion {
  id: string
  status: SuggestionStatus
  text: string
}

const STATUS_CLASSES: Record<SuggestionStatus, string> = {
  success: 'border-emerald-500/40 bg-emerald-500/10',
  danger: 'border-red-500/40 bg-red-500/10'
}

function buildSuggestions(passwords: StoredPassword[]): Suggestion[] {
  const reused = countReusedPasswords(passwords)
  const stale = countStalePasswords(passwords, STALE_AFTER_MONTHS)
  return [
    {
      id: 'reused',
      status: reused > 0 ? 'danger' : 'success',
      text:
        reused > 0
          ? `${reused} passwords share the same value with another entry. Consider changing them.`
          : 'No reused passwords.'
    },
    {
      id: 'stale',
      status: stale > 0 ? 'danger' : 'success',
      text:
        stale > 0
          ? `You haven't changed ${stale} passwords for more than ${STALE_AFTER_MONTHS} months.`
          : `All passwords were changed within the last ${STALE_AFTER_MONTHS} months.`
    }
  ]
}

export default function Suggestions({ passwords }: { passwords: StoredPassword[] }) {
  const suggestions = buildSuggestions(passwords)

  return (
    <ul aria-label='Suggestions' className='flex flex-col gap-2 text-sm'>
      {suggestions.map((suggestion) => (
        <li
          key={suggestion.id}
          className={`rounded-md border px-4 py-3 transition-colors ${STATUS_CLASSES[suggestion.status]}`}
        >
          {suggestion.text}
        </li>
      ))}
    </ul>
  )
}
