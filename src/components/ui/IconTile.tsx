import type { ReactNode } from 'react'

export default function IconTile({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`relative isolate grid shrink-0 place-items-center overflow-hidden rounded-2xl ring-1 ring-inset ring-current/10 ${className}`}>
    <svg className="pointer-events-none absolute inset-0 size-full opacity-20" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M-8 42 42-8M15 72 72 15" stroke="currentColor" strokeWidth="1" />
      <circle cx="57" cy="9" r="15" fill="currentColor" fillOpacity=".3" />
      <circle cx="8" cy="57" r="18" stroke="currentColor" />
    </svg>
    <span className="relative grid place-items-center">{children}</span>
  </span>
}
