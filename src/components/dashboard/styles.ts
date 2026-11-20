export const heroActionClass =
  'inline-flex h-10 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30'

export const heroPrimaryActionClass =
  'inline-flex h-10 items-center gap-2 rounded-xl bg-white px-3.5 text-sm font-bold text-brand-700 shadow-lg shadow-brand-900/20 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40'

export type DashboardTone = 'brand' | 'sky' | 'emerald' | 'amber' | 'rose' | 'indigo'

export const TONE_ICON: Record<DashboardTone, string> = {
  brand: 'bg-brand-50 text-brand-600 ring-brand-100',
  sky: 'bg-sky-50 text-sky-600 ring-sky-100',
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  rose: 'bg-rose-50 text-rose-600 ring-rose-100',
  indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
}

export const TONE_GLOW: Record<DashboardTone, string> = {
  brand: 'bg-brand-200/50',
  sky: 'bg-sky-200/50',
  emerald: 'bg-emerald-200/50',
  amber: 'bg-amber-200/50',
  rose: 'bg-rose-200/50',
  indigo: 'bg-indigo-200/50',
}

const FALLBACK_COLOR = '#6a3ce0'

export function subjectColor(color?: string) {
  return color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : FALLBACK_COLOR
}
