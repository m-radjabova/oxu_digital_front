import { NavLink } from 'react-router-dom'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import type { Role } from '../types'
import { navItemsFor } from './navigation'

const MAX_TABS = 4

export default function MobileTabBar({ role, onMenu }: { role: Role; onMenu: () => void }) {
  const tabs = navItemsFor(role).filter((item) => item.tab).slice(0, MAX_TABS)

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      aria-label="Pastki menyu"
    >
      <ul className="mx-auto grid max-w-lg" style={{ gridTemplateColumns: `repeat(${tabs.length + 1}, minmax(0, 1fr))` }}>
        {tabs.map(({ path, short, icon: Icon }) => (
          <li key={path}>
            <NavLink
              to={`/${role}/${path}`}
              className={({ isActive }) =>
                `flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
                  isActive ? 'text-brand-700' : 'text-slate-500 active:text-slate-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`grid h-7 w-12 place-items-center rounded-full transition ${
                      isActive ? 'bg-brand-100 text-brand-700' : ''
                    }`}
                  >
                    <Icon sx={{ fontSize: 21 }} />
                  </span>
                  <span className="max-w-full truncate px-1">{short}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={onMenu}
            className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 transition active:text-slate-800"
            aria-label="To‘liq menyuni ochish"
          >
            <span className="grid h-7 w-12 place-items-center rounded-full">
              <MenuRoundedIcon sx={{ fontSize: 21 }} />
            </span>
            Menyu
          </button>
        </li>
      </ul>
    </nav>
  )
}
