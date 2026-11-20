import { createContext } from 'react'

/** Foydalanuvchi tanlovi: aniq rejim yoki qurilma sozlamasiga ergashish */
export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

/** index.html dagi boshlang'ich skript ham shu kalitdan o'qiydi */
export const THEME_STORAGE_KEY = 'oxu-theme'

export interface ThemeContextValue {
  preference: ThemePreference
  theme: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export default ThemeContext
