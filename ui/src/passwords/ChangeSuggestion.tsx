import { useState } from 'react'
import Button from '../components/Button'
import VerticalRoulette, { type RouletteItem } from '../components/VerticalRoulette'
import { pickSuggestion } from './suggestionOdds'
import type { PasswordEntry } from './model'

interface ChangeSuggestionProps {
  passwords: PasswordEntry[]
  onChange: (entry: PasswordEntry) => void
  onClose: () => void
}

export default function ChangeSuggestion({ passwords, onChange, onClose }: ChangeSuggestionProps) {
  const [suggestion] = useState(() => pickSuggestion(passwords))
  const [finished, setFinished] = useState(false)

  const items: RouletteItem[] = suggestion.list.map(({ entry, chance }) => ({
    id: entry.id,
    label: entry.title || 'Untitled',
    hint: `${chance.toFixed(1)}%`
  }))

  const winner = suggestion.list[suggestion.winnerIndex]

  return (
    <div className='flex flex-col gap-6 py-2'>
      <VerticalRoulette
        items={items}
        winnerIndex={suggestion.winnerIndex}
        onFinish={() => setFinished(true)}
      />
      {finished ? (
        <div className='flex flex-col items-center gap-4 text-center transition-[opacity,translate] duration-500 ease-out starting:translate-y-4 starting:opacity-0'>
          <div>
            <p className='text-lg'>
              Time to change <b>{winner.entry.title || 'Untitled'}</b>
            </p>
            <p className='text-sm text-muted'>
              Rolled {suggestion.roll} of 100 · chance {winner.chance.toFixed(1)}% · last changed{' '}
              {winner.entry.passwordChangedAt.toLocaleDateString()}
            </p>
          </div>
          <div className='flex gap-3'>
            <Button onClick={() => onChange(winner.entry)}>Change now</Button>
            <Button type='secondary' onClick={onClose}>
              Later
            </Button>
          </div>
        </div>
      ) : (
        <p className='animate-pulse text-center text-sm text-muted'>Picking a password…</p>
      )}
    </div>
  )
}
