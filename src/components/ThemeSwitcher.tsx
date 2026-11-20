import type { ReactNode } from 'react'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import SettingsBrightnessRoundedIcon from '@mui/icons-material/SettingsBrightnessRounded'
import useTheme from '../hooks/useTheme'
import type { ThemePreference } from '../context/ThemeContext'

const OPTIONS: { value: ThemePreference; label: string; icon: ReactNode }[] = [
  { value: 'light', label: 'Kunduzgi', icon: <LightModeRoundedIcon sx={{ fontSize: 16 }} /> },
  { value: 'dark', label: 'Tungi', icon: <DarkModeRoundedIcon sx={{ fontSize: 16 }} /> },
  { value: 'system', label: 'Tizim', icon: <SettingsBrightnessRoundedIcon sx={{ fontSize: 16 }} /> },
]

/** Headerdagi tezkor almashtirgich: quyosh ↔ oy ikonkasi aylanib almashadi */
export default function ThemeToggleButton({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const label = isDark ? 'Kunduzgi rejimga o‘tish' : 'Tungi rejimga o‘tish'

  return (
    <button type="button" className={`relative grid place-items-center overflow-hidden ${className}`} aria-label={label} title={label} onClick={toggleTheme}>
      <LightModeRoundedIcon
        sx={{ fontSize: 19 }}
        className={`theme-keep-transition absolute text-amber-300 transition duration-300 motion-reduce:transition-none ${isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'}`}
      />
      <DarkModeRoundedIcon
        sx={{ fontSize: 18 }}
        className={`theme-keep-transition absolute transition duration-300 motion-reduce:transition-none ${isDark ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
      />
    </button>
  )
}

/** Kunduzgi / Tungi / Tizim tanlovi (menyu va sozlamalar uchun) */
export function ThemeSegmented({ className = '' }: { className?: string }) {
  const { preference, setPreference } = useTheme()

  return (
    <div className={`grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 ${className}`} role="radiogroup" aria-label="Ko‘rinish rejimi">
      {OPTIONS.map((option) => {
        const active = preference === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={`flex h-8 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition ${
              active ? 'bg-surface text-brand-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
            onClick={() => setPreference(option.value)}
          >
            {option.icon}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
