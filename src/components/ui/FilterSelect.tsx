import type { ReactNode, SelectHTMLAttributes } from 'react'
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'

/** Native select keeps keyboard navigation and mobile pickers intact. */
export default function FilterSelect({ icon = <FilterAltRoundedIcon />, className = '', value, disabled, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { icon?: ReactNode }) {
  const active = value !== undefined && value !== '' && value !== 'all'
  return <span className="filter-select relative block w-full min-w-0" data-active={active} data-disabled={Boolean(disabled)}>
    <span className="filter-select-icon pointer-events-none absolute left-2 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-lg bg-brand-50 text-brand-700 [&_svg]:size-[18px]" aria-hidden="true">{icon}</span>
    <select {...props} value={value} disabled={disabled} className={`filter-control ${className}`}>{children}</select>
    <ExpandMoreRoundedIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" sx={{ fontSize: 19 }} />
  </span>
}
