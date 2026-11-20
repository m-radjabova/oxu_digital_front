import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { Skeleton } from './Skeleton'

/**
 * Admin ro'yxatlari uchun yagona jadval ko'rinishi.
 * Kichik ekranlarda jadval gorizontal aylantiriladi, birinchi/oxirgi ustunlar karta chetiga moslashadi.
 */
export function Table({
  caption,
  minWidth = 'min-w-[760px]',
  children,
}: {
  caption?: string
  minWidth?: string
  children: ReactNode
}) {
  return (
    <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
      <table className={`w-full ${minWidth} border-separate border-spacing-0 text-left text-sm`}>
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  )
}

const EDGE = 'first:pl-3 last:pr-3 sm:first:pl-4 sm:last:pr-4'

export function Th({ className = '', icon, children, ...rest }: ThHTMLAttributes<HTMLTableCellElement> & { icon?: ReactNode }) {
  return (
    <th
      scope="col"
      className={`whitespace-nowrap border-b border-slate-200/80 bg-slate-50/80 px-3 py-2.5 text-[11px] font-bold uppercase tracking-[.08em] text-slate-400 ${EDGE} ${className}`}
      {...rest}
    >{icon ? <span className="inline-flex items-center gap-2 align-middle"><span className="grid size-6 shrink-0 place-items-center rounded-lg bg-brand-100/60 text-brand-700 [&_svg]:size-3.5" aria-hidden="true">{icon}</span>{children}</span> : children}</th>
  )
}

export function Tr({ className = '', ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`group/row transition-colors hover:bg-slate-50/70 ${className}`} {...rest} />
}

export function Td({ className = '', ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={`border-b border-slate-100 px-3 py-2.5 align-middle group-last/row:border-b-0 ${EDGE} ${className}`}
      {...rest}
    />
  )
}

export function TableSkeleton({ rows = 6, columns }: { rows?: number; columns: number }) {
  return (
    <tbody aria-hidden="true">
      {Array.from({ length: rows }, (_, row) => (
        <tr key={row}>
          {Array.from({ length: columns }, (_, column) => (
            <Td key={column}>
              {column === 1 ? (
                <span className="flex items-center gap-3">
                  <Skeleton className="size-10 shrink-0 rounded-xl" />
                  <span className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-44" />
                  </span>
                </span>
              ) : (
                <Skeleton className={column === 0 ? 'h-3 w-5' : 'h-6 w-20 rounded-full'} />
              )}
            </Td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}

/** Jadval qatoridagi kichik amal tugmasi (tahrirlash, holatni o'zgartirish). */
export function RowAction({
  label,
  tone = 'neutral',
  onClick,
  children,
}: {
  label: string
  tone?: 'neutral' | 'danger' | 'success'
  onClick: () => void
  children: ReactNode
}) {
  const tones = {
    neutral: 'border-brand-100 bg-brand-50/50 text-brand-700 hover:border-brand-200 hover:bg-brand-100',
    danger: 'border-rose-100 bg-rose-50/50 text-rose-700 hover:border-rose-200 hover:bg-rose-100',
    success: 'border-emerald-100 bg-emerald-50/50 text-emerald-700 hover:border-emerald-200 hover:bg-emerald-100',
  }
  return (
    <button
      type="button"
      className={`mx-0.5 grid size-9 place-items-center rounded-xl border transition motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 ${tones[tone]}`}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

/** Faol / nofaol holat belgisi. */
export function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
        active ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-slate-100 text-slate-500 ring-slate-200'
      }`}
    >
      <span className={`size-1.5 rounded-full ${active ? 'bg-emerald-500 shadow-[0_0_0_3px_rgb(16_185_129/0.18)]' : 'bg-slate-400'}`} aria-hidden="true" />
      {active ? 'Faol' : 'Nofaol'}
    </span>
  )
}

/** Jadval ustidagi segmentli filtr (masalan: Barchasi / Faol / Nofaol). */
export function SegmentedFilter<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T
  options: { value: T; label: string; count?: number }[]
  onChange: (value: T) => void
  ariaLabel: string
}) {
  return (
    <div className="inline-flex min-w-0 max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-50 p-1 shadow-inner" role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            className={`inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition ${
              active ? 'bg-action-primary text-white shadow-sm' : 'text-slate-500 hover:bg-surface hover:text-slate-800'
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={`rounded-md px-1.5 py-px text-[10px] font-bold tabular-nums ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-500'
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
