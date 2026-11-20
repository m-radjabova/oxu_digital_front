import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import CalendarMonthOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'

const links = [
  { path: '/admin/schedule/teachers', label: 'O‘qituvchilar dars jadvali' },
  { path: '/admin/schedule/groups', label: 'Guruhlar dars jadvali' },
]

export default function ScheduleNavigation({ collapsed, onClose }: { collapsed: boolean; onClose: () => void }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(() => pathname.startsWith('/admin/schedule'))
  const active = links.some((item) => item.path === pathname)
  return <li className={`rounded-2xl ${expanded ? 'bg-white/[0.025]' : ''}`}>
    <button type="button" title={collapsed ? 'Dars jadvali' : undefined} aria-expanded={expanded} aria-controls="schedule-navigation-children" onClick={() => {
      if (collapsed && window.matchMedia('(min-width: 1024px)').matches) { navigate('/admin/schedule/groups'); onClose() }
      else setExpanded(!expanded)
    }} className={`flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-violet-300 ${collapsed ? 'lg:justify-center lg:px-0' : ''} ${active || expanded ? 'bg-gradient-to-r from-[#6049f2] to-[#704af4] text-white shadow-lg ring-1 ring-white/15' : 'text-indigo-100/75 hover:bg-white/[0.07]'}`}>
      <span className="grid size-8 shrink-0 place-items-center"><CalendarMonthOutlinedIcon sx={{ fontSize: 23 }} /></span>
      <span className={`flex-1 text-left ${collapsed ? 'lg:hidden' : ''}`}>Dars jadvali</span>
      <KeyboardArrowDownRoundedIcon className={`${expanded ? 'rotate-180' : ''} transition-transform ${collapsed ? 'lg:hidden' : ''}`} sx={{ fontSize: 21 }} />
    </button>
    {expanded && <ul id="schedule-navigation-children" className={`ml-9 mr-2 mt-3 space-y-1 border-l-2 border-indigo-300/25 pb-2 ${collapsed ? 'lg:hidden' : ''}`}>
      {links.map(({ path, label }) => <li key={path} className="relative before:absolute before:left-0 before:top-5 before:h-0.5 before:w-4 before:bg-indigo-300/25"><NavLink to={path} onClick={onClose} className={({ isActive }) => `ml-4 block rounded-lg px-3 py-2 text-sm transition focus-visible:outline-2 focus-visible:outline-violet-300 ${isActive ? 'bg-white/10 font-semibold text-white' : 'text-indigo-100/75 hover:bg-white/[0.06] hover:text-white'}`}>{label}</NavLink></li>)}
    </ul>}
  </li>
}
