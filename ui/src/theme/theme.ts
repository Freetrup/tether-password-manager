export type ThemePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme'
const systemDark = window.matchMedia('(prefers-color-scheme: dark)')

export function readThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'light' || value === 'dark') return value
  } catch {}
  return 'system'
}

function persistThemePreference(preference: ThemePreference) {
  try {
    if (preference === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, preference)
  } catch {}
}

function applyTheme(preference: ThemePreference) {
  const isDark = preference === 'dark' || (preference === 'system' && systemDark.matches)
  document.documentElement.classList.toggle('dark', isDark)
}

export function connectTheme(
  getPreference: () => ThemePreference,
  subscribe: (listener: () => void) => () => void
) {
  let current = getPreference()
  applyTheme(current)

  const unsubscribeStore = subscribe(() => {
    const next = getPreference()
    if (next === current) return
    current = next
    persistThemePreference(next)
    applyTheme(next)
  })

  const onSystemChange = () => {
    if (current === 'system') applyTheme('system')
  }
  systemDark.addEventListener('change', onSystemChange)

  return () => {
    unsubscribeStore()
    systemDark.removeEventListener('change', onSystemChange)
  }
}
