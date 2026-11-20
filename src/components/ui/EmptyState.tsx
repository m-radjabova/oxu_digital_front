import type { ReactNode } from 'react'
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}>
      <div className="relative grid h-28 w-44 place-items-center">
        <svg className="absolute inset-0 size-full text-brand-500" viewBox="0 0 176 112" fill="none" aria-hidden="true">
          <ellipse cx="88" cy="56" rx="76" ry="42" fill="currentColor" fillOpacity=".04" />
          <ellipse cx="88" cy="56" rx="63" ry="34" stroke="currentColor" strokeOpacity=".2" strokeDasharray="3 5" />
          <path d="m26 26 2-6 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="currentColor" fillOpacity=".45" />
          <path d="M139 73v12m-6-6h12" stroke="currentColor" strokeOpacity=".5" strokeWidth="2" strokeLinecap="round" />
          <circle cx="144" cy="29" r="4" stroke="currentColor" strokeOpacity=".35" strokeWidth="2" />
          <circle cx="36" cy="83" r="3" fill="currentColor" fillOpacity=".3" />
        </svg>
        <span className="relative grid size-16 -rotate-6 place-items-center rounded-2xl border border-brand-200 bg-brand-50 text-brand-700 shadow-sm [&>svg]:size-7">{icon || <InboxOutlinedIcon />}</span>
      </div>
      <h3 className="mt-4 text-sm font-bold text-slate-800">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
