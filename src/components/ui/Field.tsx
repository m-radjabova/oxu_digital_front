import type { ReactNode } from 'react'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  icon,
  className = '',
  children,
}: {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  required?: boolean
  icon?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <label htmlFor={htmlFor} className={`block ${className}`}>
      <span className="flex items-center gap-1 text-[13px] font-semibold text-slate-700">
        {icon && <span className="mr-1 inline-flex text-brand-700 [&>svg]:size-4" aria-hidden="true">{icon}</span>}
        {label}
        {required && <span className="text-rose-500" aria-hidden="true">*</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 flex items-start gap-1 text-xs font-medium text-rose-600">
          <ErrorOutlineRoundedIcon sx={{ fontSize: 14 }} className="mt-px shrink-0" />
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>
      ) : null}
    </label>
  )
}
