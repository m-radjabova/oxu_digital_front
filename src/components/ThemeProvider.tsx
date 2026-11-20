import { useCallback, useEffect, useLayoutEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import ThemeContext, {
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemeContextValue,
  type ThemePreference,
} from '../context/ThemeContext'

const DARK_QUERY = '(prefers-color-scheme: dark)'
/** Brauzer paneli rangi (mobil) — sidebar foni bilan bir xil */
const THEME_COLORS: Record<ResolvedTheme, string> = { light: '#2a2559', dark: '#1b1944' }

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // localStorage yopiq bo'lsa (private rejim) qurilma sozlamasiga ergashamiz
  }
  return 'system'
}

function subscribeSystemTheme(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

/** Rejim almashganda yuzlab elementning rang animatsiyasi "sudralib" ketmasligi uchun o'tishlar bir kadrga o'chiriladi */
function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement
  if (root.classList.contains('dark') === (theme === 'dark')) return
  root.classList.add('theme-switching')
  root.classList.toggle('dark', theme === 'dark')
  void root.offsetHeight
  requestAnimationFrame(() => root.classList.remove('theme-switching'))
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference)
  const systemTheme = useSyncExternalStore(subscribeSystemTheme, getSystemTheme, () => 'light' as const)
  const theme: ResolvedTheme = preference === 'system' ? systemTheme : preference

  useLayoutEffect(() => {
    applyTheme(theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme])
  }, [theme])

  // Boshqa tabda o'zgartirilsa shu tab ham ergashadi
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === THEME_STORAGE_KEY) setPreferenceState(readPreference())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // saqlab bo'lmasa ham joriy sessiyada ishlayveradi
    }
  }, [])

  const toggleTheme = useCallback(() => setPreference(theme === 'dark' ? 'light' : 'dark'), [setPreference, theme])

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, theme, setPreference, toggleTheme }),
    [preference, theme, setPreference, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
