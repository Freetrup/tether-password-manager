import type { ReactNode } from 'react'
import { useAppDispatch, useAppSelector } from '../store'
import { themePreferenceChanged } from '../store/themeSlice'
import type { ThemePreference } from '../theme/theme'

const iconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true
}

const OPTIONS: { value: ThemePreference; label: string; icon: ReactNode }[] = [
  {
    value: 'light',
    label: 'Light',
    icon: (
      <svg {...iconProps}>
        <circle cx='12' cy='12' r='4' />
        <path d='M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41' />
      </svg>
    )
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: (
      <svg {...iconProps}>
        <path d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' />
      </svg>
    )
  },
  {
    value: 'system',
    label: 'System',
    icon: (
      <svg {...iconProps}>
        <rect x='2' y='3' width='20' height='14' rx='2' />
        <path d='M8 21h8M12 17v4' />
      </svg>
    )
  }
]

export default function ThemeSwitcher() {
  const preference = useAppSelector((s) => s.theme.preference)
  const dispatch = useAppDispatch()

  return (
    <div
      role='group'
      aria-label='Theme'
      className='inline-flex gap-1 rounded-full border border-line p-1'
    >
      {OPTIONS.map(({ value, label, icon }) => {
        const active = preference === value
        return (
          <button
            key={value}
            type='button'
            title={label}
            aria-label={label}
            aria-pressed={active}
            onClick={() => dispatch(themePreferenceChanged(value))}
            className={
              'grid size-7 place-items-center rounded-full transition-all ' +
              (active ? 'bg-black/5 text-ink dark:bg-white/10' : 'text-muted hover:text-ink')
            }
          >
            {icon}
          </button>
        )
      })}
    </div>
  )
}
