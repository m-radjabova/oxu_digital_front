import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import MenuOpenRoundedIcon from '@mui/icons-material/MenuOpenRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import type { User } from '../types'
import ConfirmDialog from './ui/ConfirmDialog'
import CampusIllustration from './CampusIllustration'
import StructureNavigation from './StructureNavigation'
import SubjectNavigation from './SubjectNavigation'
import ScheduleNavigation from './ScheduleNavigation'
import { NAV_SECTIONS, ROLE_LABELS, navItemsFor } from './navigation'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300'

/* ---------- Sidebar ---------- */

export default function Sidebar({
  user,
  onLogout,
  open,
  collapsed = false,
  onToggleCollapsed,
  onClose,
}: {
  user: User
  onLogout: () => void
  open: boolean
  /** Faqat desktopda: sidebar ikonkalar qatoriga yig'iladi */
  collapsed?: boolean
  onToggleCollapsed?: () => void
  onClose: () => void
}) {
  const { pathname } = useLocation()
  const [confirmLogout, setConfirmLogout] = useState(false)
  const items = navItemsFor(user.role)
  // Yig'ilgan holatda desktopda yashiriladigan elementlar uchun
  const hideWhenCollapsed = collapsed ? 'lg:hidden' : ''

  // Eslatma: ota komponentda onClose useCallback bilan o'ralgan bo'lishi kerak
  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  // ⚠️ Agar User turida maydon nomi boshqacha bo'lsa (masalan fullName), shu yerni moslang
  const displayName: string = (user as { name?: string }).name ?? ROLE_LABELS[user.role]
  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || 'U'

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-[#0f0c2d]/60 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden="true"
        onClick={onClose}
      />

      <aside
        className={`theme-fixed fixed inset-y-0 left-0 z-50 isolate flex w-[272px] flex-col overflow-hidden bg-gradient-to-b from-[#2a2559] via-[#28235a] to-[#1b1944] text-white transition-[transform,width] duration-300 ease-out motion-reduce:transition-none lg:z-30 lg:translate-x-0 ${
          open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } ${collapsed ? 'lg:w-[84px]' : ''}`}
        aria-label="Yon menyu"
      >
        {/* Fon: yumshoq nur dog'lari va nuqtali to'r */}
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
          <div className="absolute -left-16 -top-20 size-64 rounded-full bg-violet-500/25 blur-3xl" />
          <div className="absolute -bottom-24 -right-20 size-64 rounded-full bg-indigo-400/15 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.5] [mask-image:linear-gradient(to_bottom,black,transparent_55%)]"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)',
              backgroundSize: '18px 18px',
            }}
          />
        </div>

        {/* Logo */}
        <div
          className={`relative z-10 flex shrink-0 items-center justify-between gap-2 px-5 pb-5 pt-6 ${
            collapsed ? 'lg:flex-col lg:justify-start lg:gap-3 lg:px-[18px]' : ''
          }`}
        >
          <NavLink
            to={`/${user.role}/dashboard`}
            onClick={onClose}
            title={collapsed ? 'OXU Digital' : undefined}
            className={`group flex min-w-0 items-center gap-3 rounded-2xl ${focusRing}`}
          >
            <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-500 text-white shadow-[0_10px_24px_-10px_rgba(167,139,250,0.9)] ring-1 ring-white/25 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105 motion-reduce:transition-none">
              <span className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/25 to-transparent" aria-hidden="true" />
              <SchoolRoundedIcon className="relative" sx={{ fontSize: 28 }} />
            </span>
            <span className={`min-w-0 leading-tight ${hideWhenCollapsed}`}>
              <span className="block truncate font-display text-[18px] font-extrabold tracking-tight text-white">
                OXU <span className="text-violet-200">Digital</span>
              </span>
              <span className="mt-1 block truncate text-[11px] font-medium tracking-wide text-indigo-200/60">
                {ROLE_LABELS[user.role]} portali
              </span>
            </span>
          </NavLink>
          <button
            type="button"
            className={`grid size-9 shrink-0 place-items-center rounded-xl text-indigo-100/60 transition hover:bg-white/10 hover:text-white lg:hidden ${focusRing}`}
            aria-label="Menyuni yopish"
            onClick={onClose}
          >
            <CloseRoundedIcon sx={{ fontSize: 20 }} />
          </button>
          {onToggleCollapsed && (
            <button
              type="button"
              className={`hidden size-9 shrink-0 place-items-center rounded-xl text-indigo-100/60 ring-1 ring-inset ring-white/10 transition hover:bg-white/10 hover:text-white lg:grid ${focusRing}`}
              aria-label={collapsed ? 'Menyuni ochish' : 'Menyuni yig‘ish'}
              aria-expanded={!collapsed}
              title={collapsed ? 'Menyuni ochish' : 'Menyuni yig‘ish'}
              onClick={onToggleCollapsed}
            >
              {collapsed ? <MenuRoundedIcon sx={{ fontSize: 20 }} /> : <MenuOpenRoundedIcon sx={{ fontSize: 20 }} />}
            </button>
          )}
        </div>

        <div className={`relative z-10 mx-5 h-px shrink-0 bg-gradient-to-r from-transparent via-white/15 to-transparent ${collapsed ? 'lg:mx-3' : ''}`} />

        {/* Navigatsiya */}
        <nav
          className={`relative z-10 mt-4 flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-3 [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin] ${
            collapsed ? 'pb-40 lg:pb-4' : 'pb-40'
          }`}
          aria-label="Asosiy menyu"
        >
          {NAV_SECTIONS.map((section) => {
            const sectionItems = items.filter((item) => item.section === section.key)
            if (!sectionItems.length) return null
            return (
              <div key={section.key}>
                <p className={`px-4 pb-2 text-xs font-semibold tracking-wide text-indigo-200/50 ${hideWhenCollapsed}`}>{section.title}</p>
                {collapsed && <span className="mx-auto mb-2 hidden h-px w-8 bg-white/10 lg:block" aria-hidden="true" />}
                <ul className="grid gap-1">
                  {sectionItems.map(({ path, title, icon: Icon }) => path === 'schedule' && user.role === 'admin' ? (
                    <ScheduleNavigation key={path} collapsed={collapsed} onClose={onClose} />

                  ) : path === 'structure' ? (
                    <StructureNavigation key={path} collapsed={collapsed} onClose={onClose} />
                  ) : path === 'subjects' ? (
                    <SubjectNavigation key={path} collapsed={collapsed} onClose={onClose} />
                  ) : (
                    <li key={path}>
                      <NavLink
                        to={`/${user.role}/${path}`}
                        onClick={onClose}
                        title={collapsed ? title : undefined}
                        className={({ isActive }) =>
                          `group relative flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm transition duration-200 motion-reduce:transition-none ${focusRing} ${
                            collapsed ? 'lg:justify-center lg:px-0' : ''
                          } ${
                            isActive
                              ? 'bg-gradient-to-r from-[#6a54d8] to-[#8160e6] font-semibold text-white shadow-[0_14px_30px_-16px_rgba(167,139,250,0.95)] ring-1 ring-white/15'
                              : 'font-medium text-indigo-100/75 hover:bg-white/[0.07] hover:text-white'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <span
                                className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-violet-200"
                                aria-hidden="true"
                              />
                            )}
                            <span
                              className={`grid size-8 shrink-0 place-items-center rounded-xl transition duration-200 motion-reduce:transition-none ${
                                isActive
                                  ? 'bg-white/20 text-white shadow-inner'
                                  : 'bg-white/[0.04] text-indigo-100/70 group-hover:bg-white/10 group-hover:text-violet-100'
                              }`}
                            >
                              <Icon sx={{ fontSize: 20 }} />
                            </span>
                            <span className={`truncate ${hideWhenCollapsed}`}>{title}</span>
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </nav>

        {/* Vektor illyustratsiya */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-[84px] z-0 h-44 text-violet-200 opacity-[0.2] ${hideWhenCollapsed}`}
          aria-hidden="true"
        >
          <CampusIllustration />
        </div>

        {/* Foydalanuvchi va chiqish */}
        <div className="relative z-10 shrink-0 border-t border-white/10 bg-[#1d1a47]/70 p-3 backdrop-blur-md">
          <div className={`flex items-center gap-3 rounded-2xl bg-white/[0.05] p-2.5 ring-1 ring-white/[0.07] ${collapsed ? 'lg:flex-col lg:gap-2' : ''}`}>
            <span
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-200 to-indigo-300 text-sm font-bold text-[#25214f]"
              title={collapsed ? displayName : undefined}
            >
              {initials}
            </span>
            <span className={`min-w-0 flex-1 leading-tight ${hideWhenCollapsed}`}>
              <span className="block truncate text-sm font-semibold text-white">{displayName}</span>
              <span className="mt-0.5 block truncate text-xs text-indigo-200/60">{ROLE_LABELS[user.role]}</span>
            </span>
            <button
              type="button"
              className={`grid size-9 shrink-0 place-items-center rounded-xl text-indigo-100/60 transition hover:bg-rose-400/15 hover:text-rose-200 ${focusRing}`}
              aria-label="Tizimdan chiqish"
              title="Tizimdan chiqish"
              onClick={() => setConfirmLogout(true)}
            >
              <LogoutRoundedIcon sx={{ fontSize: 20 }} />
            </button>
          </div>
        </div>
      </aside>

      <ConfirmDialog
        open={confirmLogout}
        title="Tizimdan chiqasizmi?"
        description="Seans tugatiladi va qayta kirish uchun login ma’lumotlari so‘raladi."
        confirmLabel="Chiqish"
        tone="danger"
        onConfirm={() => {
          setConfirmLogout(false)
          onLogout()
        }}
        onClose={() => setConfirmLogout(false)}
      />
    </>
  )
}
