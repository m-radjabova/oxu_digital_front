import type { ReactNode } from 'react'

export type BadgeTone = 'brand' | 'success' | 'danger' | 'warning' | 'info' | 'neutral'

const TONES: Record<BadgeTone, string> = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-100',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  danger: 'bg-rose-50 text-rose-700 ring-rose-100',
  warning: 'bg-amber-50 text-amber-700 ring-amber-100',
  info: 'bg-sky-50 text-sky-700 ring-sky-100',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export default function Badge({
  tone = 'neutral',
  dot = false,
  className = '',
  children,
}: {
  tone?: BadgeTone
  dot?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${TONES[tone]} ${className}`}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  )
}
