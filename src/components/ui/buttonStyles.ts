export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger' | 'dangerSoft' | 'dangerGhost' | 'success' | 'telegram'
export type ButtonSize = 'sm' | 'md' | 'lg'

const BASE = 'inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 active:scale-[.985] disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-action-primary text-white shadow-sm hover:bg-action-primary-hover',
  secondary: 'border border-slate-200 bg-surface text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-action-danger text-white shadow-sm hover:bg-action-danger-hover',
  dangerSoft: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
  dangerGhost: 'text-rose-600 hover:bg-rose-50 hover:text-rose-700',
  success: 'bg-action-success text-white shadow-sm hover:bg-action-success-hover',
  telegram: 'bg-sky-500 text-white shadow-[0_10px_30px_-12px_rgb(14_165_233/0.65)] hover:bg-sky-600',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-sm',
}

export function buttonClass({
  variant = 'primary',
  size = 'md',
  className = '',
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`.trim()
}
