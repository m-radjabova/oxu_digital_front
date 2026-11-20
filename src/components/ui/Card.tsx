import type { HTMLAttributes, ReactNode } from 'react'
import IconTile from './IconTile'

export default function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`min-w-0 rounded-2xl border border-slate-200/80 bg-surface shadow-card ${className}`} {...rest} />
}

export function SectionHeader({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        {icon && (
          <IconTile className="size-10 bg-brand-50 text-brand-700">
            {icon}
          </IconTile>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          {description && <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}
