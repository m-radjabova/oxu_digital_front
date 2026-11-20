import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded'
import { Skeleton } from './Skeleton'

export type MetricTone = 'brand' | 'sky' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate'

export default function MetricCard({ icon, label, value, hint, tone = 'brand', to, loading = false, delay = 0 }: {
  icon: ReactNode; label: string; value: ReactNode; hint?: ReactNode; tone?: MetricTone
  to?: string; loading?: boolean; delay?: number
}) {
  const style = { '--metric-accent': `var(--color-${tone}-500)`, '--metric-ink': `var(--color-${tone}-700)`, animationDelay: `${delay}ms` } as CSSProperties
  const className = `metric-card group relative isolate block min-w-0 overflow-hidden rounded-lg border border-slate-200/80 bg-surface p-3 shadow-card sm:p-4 ${to ? 'transition duration-200 hover:border-slate-300 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 motion-safe:hover:-translate-y-0.5' : ''}`
  const body = <>
    <svg viewBox="0 0 400 160" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 -z-10 size-full" fill="none" aria-hidden="true" style={{ color: 'var(--metric-accent)' }}>
      <path d="M148 0H400V160Z" fill="currentColor" fillOpacity=".07" />
      <path d="M240 0 400 160H104Z" fill="currentColor" fillOpacity=".055" />
      <path d="m148 0 252 160M240 0 104 160" stroke="currentColor" strokeOpacity=".12" />
    </svg>
    <span className="absolute inset-y-4 left-0 w-[3px] rounded-r-full" style={{ backgroundColor: 'var(--metric-accent)' }} aria-hidden="true" />
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1"><p className="min-h-8 text-[10px] font-bold uppercase leading-[18px] tracking-[.07em] text-slate-500">{label}</p>
        {loading ? <Skeleton className="mt-1 h-9 w-20" /> : <p className="mt-1 font-display text-2xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-3xl">{value}</p>}
      </div>
      <span className="grid size-9 shrink-0 place-items-center rounded-lg border bg-surface/80 shadow-sm [&_svg]:size-6" style={{ color: 'var(--metric-ink)', borderColor: 'color-mix(in oklab, var(--metric-accent) 22%, transparent)' }} aria-hidden="true">{icon}</span>
    </div>
    <div className="mt-2 flex min-h-4 items-center justify-between gap-2"><span className="min-w-0 text-[11px] leading-4 text-slate-500">{hint}</span>{to && <ArrowOutwardRoundedIcon className="shrink-0 text-slate-400 transition group-hover:text-brand-700" sx={{ fontSize: 16 }} />}</div>
  </>
  return to ? <Link to={to} className={className} style={style}>{body}</Link> : <div className={className} style={style}>{body}</div>
}
