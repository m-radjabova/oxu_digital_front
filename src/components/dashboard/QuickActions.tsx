import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { TONE_ICON, type DashboardTone } from './styles'
import IconTile from '../ui/IconTile'

export interface QuickAction {
  to: string
  icon: ReactNode
  title: string
  text: string
  tone?: DashboardTone
}

export default function QuickActions({ items }: { items: QuickAction[] }) {
  return (
    <ul className="grid gap-2">
      {items.map((item) => (
        <li key={item.to + item.title}>
          <Link
            to={item.to}
            className="group flex items-center gap-3 rounded-2xl border border-transparent p-2.5 transition hover:border-slate-200 hover:bg-slate-50"
          >
            <IconTile className={`size-11 transition motion-safe:group-hover:scale-105 ${TONE_ICON[item.tone || 'brand']}`}>
              {item.icon}
            </IconTile>
            <span className="min-w-0 flex-1">
              <b className="block truncate text-sm font-semibold text-slate-900">{item.title}</b>
              <small className="block truncate text-xs text-slate-500">{item.text}</small>
            </span>
            <ChevronRightRoundedIcon
              sx={{ fontSize: 20 }}
              className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
            />
          </Link>
        </li>
      ))}
    </ul>
  )
}
