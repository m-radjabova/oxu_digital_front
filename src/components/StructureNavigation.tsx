import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'

const links = [
  { tab: 'faculties', label: 'Fakultetlar' },
  { tab: 'departments', label: 'Kafedralar' },
  { tab: 'directions', label: 'Ta’lim yo‘nalishlari' },
]

export default function StructureNavigation({ collapsed, onClose }: { collapsed: boolean; onClose: () => void }) {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const active = pathname === '/admin/structure'
  const selected = new URLSearchParams(search).get('tab') || 'faculties'
  return <li className={`rounded-2xl ${expanded ? 'bg-white/[0.025]' : ''}`}>
    <button type="button" title={collapsed ? 'Tuzilma' : undefined} aria-expanded={expanded} aria-controls="structure-navigation-children" onClick={() => {
      if (collapsed && window.matchMedia('(min-width: 1024px)').matches) { navigate('/admin/structure'); onClose() }
      else setExpanded(!expanded)
    }} className={`flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-violet-300 ${collapsed ? 'lg:justify-center lg:px-0' : ''} ${active || expanded ? 'bg-gradient-to-r from-[#6049f2] to-[#704af4] text-white shadow-lg ring-1 ring-white/15' : 'text-indigo-100/75 hover:bg-white/[0.07]'}`}><span className="grid size-8 shrink-0 place-items-center"><LayersOutlinedIcon sx={{ fontSize: 23 }} /></span><span className={`flex-1 text-left ${collapsed ? 'lg:hidden' : ''}`}>Tuzilma</span><KeyboardArrowDownRoundedIcon className={`${expanded ? 'rotate-180' : ''} transition-transform ${collapsed ? 'lg:hidden' : ''}`} sx={{ fontSize: 21 }} /></button>
    {expanded && <ul id="structure-navigation-children" className={`ml-9 mr-2 mt-3 space-y-1 border-l-2 border-indigo-300/25 pb-2 ${collapsed ? 'lg:hidden' : ''}`}>
      {links.map(({ tab, label }) => <li className="relative before:absolute before:left-0 before:top-5 before:h-0.5 before:w-4 before:bg-indigo-300/25" key={tab}><NavLink to={`/admin/structure?tab=${tab}`} onClick={onClose} className={`ml-4 block rounded-lg px-3 py-2 text-sm transition focus-visible:outline-2 focus-visible:outline-violet-300 ${active && selected === tab ? 'bg-white/10 font-semibold text-white' : 'text-indigo-100/75 hover:bg-white/[0.06] hover:text-white'}`}>{label}</NavLink></li>)}
    </ul>}
  </li>
}
