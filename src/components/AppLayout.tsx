import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import TelegramIcon from '@mui/icons-material/Telegram'
import TodayRoundedIcon from '@mui/icons-material/TodayRounded'
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined'
import Sidebar from './Sidebar'
import MobileTabBar from './MobileTabBar'
import TelegramProvider from './TelegramProvider'
import TelegramConnectPrompt from './TelegramConnectPrompt'
import TopProgress from './TopProgress'
import ThemeToggleButton, { ThemeSegmented } from './ThemeSwitcher'
import Card from './ui/Card'
import { Skeleton } from './ui/Skeleton'
import { ROLE_LABELS } from './navigation'
import useAuth from '../hooks/useAuth'
import useTelegram from '../hooks/useTelegram'
import { formatWeekdayDate } from '../utils/date'
import type { Role } from '../types'

const TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  schedule: 'Dars jadvali',
  availability: 'Band vaqtlarim',
  workload: 'Mening yuklamalarim',
  accounts: 'Hisoblar',
  groups: 'Guruhlar',
  subjects: 'Fanlar',
  'academic-load': 'Akademik soatlar nazorati',
  structure: 'Ta’lim tuzilmasi',
  buildings: 'Binolar va xonalar',
  profile: 'Profil',
  attendance: 'Davomat',
}

const ROLE_DOTS: Record<Role, string> = {
  admin: 'bg-violet-300',
  teacher: 'bg-sky-300',
  student: 'bg-amber-300',
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300'

/** Header sidebar bilan bir xil to'q fonda: ikkalasi bitta yaxlit ramka bo'lib ko'rinadi */
const headerControlClass =
  'border border-white/10 bg-white/[0.06] text-indigo-100/80 transition hover:border-white/20 hover:bg-white/10 hover:text-white'

const SIDEBAR_STORAGE_KEY = 'oxu-sidebar-collapsed'

function getInitials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || 'U'
  )
}

export default function AppLayout() {
  return (
    <TelegramProvider>
      <LayoutShell />
      <TelegramConnectPrompt />
    </TelegramProvider>
  )
}

function LayoutShell() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Desktopda sidebar faqat ikonkalar ko'rinishiga yig'iladi; tanlov saqlanib qoladi
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1')
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPathname, setMenuPathname] = useState(pathname)
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])
  const openSidebar = useCallback(() => setSidebarOpen(true), [])
  const toggleSidebarCollapsed = useCallback(() => setSidebarCollapsed((current) => !current), [])

  const titleKey = pathname.includes('/attendance/')
    ? 'attendance'
    : pathname.split('/').at(-1) || ''

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarCollapsed ? '1' : '0')
  }, [sidebarCollapsed])

  // Sahifa almashganda menyu yopiladi (render paytida, effektsiz)
  if (menuPathname !== pathname) {
    setMenuPathname(pathname)
    setMenuOpen(false)
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  // Sahifa aylantirilganda header soyasi paydo bo'ladi
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 4)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  if (!user) return null

  const initials = getInitials(user.name)

  return (
    <div className="relative min-h-dvh bg-canvas">
      {/* Yumshoq fon nurlari */}
      <div
        className={`pointer-events-none fixed inset-y-0 right-0 left-0 z-0 ${sidebarCollapsed ? 'lg:left-[84px]' : 'lg:left-[272px]'}`}
        aria-hidden="true"
      >
        <div className="absolute -top-32 right-0 size-[420px] rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-500/10" />
        <div className="absolute left-1/3 top-1/2 size-[360px] rounded-full bg-sky-200/20 blur-3xl dark:bg-sky-500/[0.06]" />
      </div>

      <a
        href="#asosiy-kontent"
        className="sr-only z-[200] rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Asosiy kontentga o‘tish
      </a>

      <Sidebar
        user={user}
        onLogout={logout}
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={toggleSidebarCollapsed}
        onClose={closeSidebar}
      />

      <div
        className={`relative z-10 flex min-h-dvh flex-col transition-[padding] duration-300 ease-out motion-reduce:transition-none ${
          sidebarCollapsed ? 'lg:pl-[84px]' : 'lg:pl-[272px]'
        }`}
      >
        <header
          className={`theme-fixed sticky top-0 z-20 border-b bg-[#2a2559]/95 text-white backdrop-blur-xl transition-[box-shadow,border-color] duration-200 motion-reduce:transition-none ${
            scrolled
              ? 'border-white/[0.08] shadow-[0_12px_30px_-18px_rgba(15,12,45,0.75)]'
              : 'border-transparent'
          }`}
        >
          <div className="flex h-16 items-center justify-between gap-2 px-3 sm:px-4 lg:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className={`grid size-10 shrink-0 place-items-center rounded-xl active:scale-95 lg:hidden ${headerControlClass} ${focusRing}`}
                aria-label="Menyuni ochish"
                onClick={() => setSidebarOpen(true)}
              >
                <MenuRoundedIcon sx={{ fontSize: 20 }} />
              </button>

              <nav className="flex min-w-0 items-center gap-2 text-sm" aria-label="Bo‘limlar">
                <Link
                  to={`/${user.role}/dashboard`}
                  className={`hidden size-8 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-indigo-100/70 transition hover:bg-white/10 hover:text-white sm:grid ${focusRing}`}
                  aria-label="OXU Digital bosh sahifa"
                >
                  <HomeRoundedIcon sx={{ fontSize: 17 }} />
                </Link>
                <span className="hidden font-medium text-indigo-200/50 sm:inline">OXU Digital</span>
                <ChevronRightRoundedIcon sx={{ fontSize: 18 }} className="hidden shrink-0 text-indigo-200/30 sm:block" />
                <strong
                  className="truncate text-[15px] font-bold tracking-tight text-white"
                  aria-current="page"
                >
                  {TITLES[titleKey] || 'Panel'}
                </strong>
              </nav>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] py-1 pl-1 pr-3.5 text-xs font-semibold text-indigo-100/80 lg:inline-flex">
                <span className="grid size-6 place-items-center rounded-full bg-white/10 text-violet-200">
                  <TodayRoundedIcon sx={{ fontSize: 14 }} />
                </span>
                {formatWeekdayDate(new Date())}
              </span>

              <span className="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-violet-100 ring-1 ring-inset ring-white/10 xl:inline-flex">
                <span className={`size-1.5 rounded-full ${ROLE_DOTS[user.role]}`} aria-hidden="true" />
                {ROLE_LABELS[user.role]}
              </span>

              <TelegramHeaderButton role={user.role} />

              <ThemeToggleButton className={`size-10 shrink-0 rounded-xl active:scale-95 ${headerControlClass} ${focusRing}`} />

              <span className="mx-0.5 hidden h-7 w-px bg-white/10 sm:block" aria-hidden="true" />

              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  className={`group flex items-center gap-2 rounded-full border p-1 pr-2 text-left transition sm:pr-3 ${focusRing} ${
                    menuOpen
                      ? 'border-violet-300/40 bg-white/10 ring-4 ring-violet-400/20'
                      : 'border-white/10 bg-white/[0.06] hover:border-white/20 hover:bg-white/10'
                  }`}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((current) => !current)}
                >
                  <span className="relative grid size-9 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-xs font-bold text-white shadow-inner ring-2 ring-white/20">
                    {initials}
                    <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-[#2a2559]" />
                  </span>
                  <span className="hidden min-w-0 leading-tight sm:block">
                    <span className="block max-w-[150px] truncate text-[13px] font-bold text-white">
                      {user.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-medium text-indigo-200/60">
                      {ROLE_LABELS[user.role]}
                    </span>
                  </span>
                  <KeyboardArrowDownRoundedIcon
                    sx={{ fontSize: 18 }}
                    className={`hidden transition-transform duration-200 sm:block ${
                      menuOpen ? 'rotate-180 text-violet-200' : 'text-indigo-200/60 group-hover:text-white'
                    }`}
                  />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="theme-adaptive absolute right-0 top-full z-30 mt-2.5 w-72 origin-top-right animate-scale-in overflow-hidden rounded-2xl border border-slate-200/80 bg-surface shadow-pop"
                  >
                    <div className="theme-fixed relative overflow-hidden bg-gradient-to-br from-[#2a2559] to-[#3b2f86] px-4 py-4 text-white">
                      <div
                        className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-violet-400/30 blur-2xl"
                        aria-hidden="true"
                      />
                      <div className="relative flex items-center gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15 text-sm font-bold ring-1 ring-white/25">
                          {initials}
                        </span>
                        <div className="min-w-0 leading-tight">
                          <p className="truncate text-sm font-bold">{user.name}</p>
                          <p className="mt-1 truncate text-xs text-indigo-100/70">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-1.5">
                      <MenuLink
                        to={`/${user.role}/dashboard`}
                        icon={<SpaceDashboardOutlinedIcon sx={{ fontSize: 18 }} />}
                        onClick={() => setMenuOpen(false)}
                      >
                        Dashboard
                      </MenuLink>
                      <MenuLink
                        to={`/${user.role}/profile`}
                        icon={<AccountCircleOutlinedIcon sx={{ fontSize: 18 }} />}
                        onClick={() => setMenuOpen(false)}
                      >
                        Profil va sozlamalar
                      </MenuLink>
                    </div>

                    <div className="border-t border-slate-100 px-3 pb-3 pt-2.5">
                      <p className="mb-2 px-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Ko‘rinish</p>
                      <ThemeSegmented />
                    </div>

                    <div className="border-t border-slate-100 p-1.5">
                      <button
                        role="menuitem"
                        type="button"
                        className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 ${focusRing}`}
                        onClick={() => {
                          setMenuOpen(false)
                          logout()
                        }}
                      >
                        <span className="grid size-8 place-items-center rounded-lg bg-rose-50 text-rose-500 transition group-hover:bg-surface">
                          <LogoutRoundedIcon sx={{ fontSize: 18 }} />
                        </span>
                        Tizimdan chiqish
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <TopProgress />
        </header>

        <main id="asosiy-kontent" className="@container min-w-0 flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
          <Suspense fallback={<RouteSkeleton />}>
            <div key={pathname} className="animate-fade-in">
              <Outlet />
            </div>
          </Suspense>
        </main>
      </div>

      <MobileTabBar role={user.role} onMenu={openSidebar} />
    </div>
  )
}

function MenuLink({
  to,
  icon,
  onClick,
  children,
}: {
  to: string
  icon: React.ReactNode
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      role="menuitem"
      to={to}
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 ${focusRing}`}
    >
      <span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:bg-brand-50 group-hover:text-brand-600">
        {icon}
      </span>
      {children}
    </Link>
  )
}

function TelegramHeaderButton({ role }: { role: Role }) {
  const { status, isInsideTelegram, openPrompt } = useTelegram()

  if (!status || isInsideTelegram) return null

  const baseClass = `relative grid size-10 shrink-0 place-items-center rounded-xl border transition active:scale-95 ${focusRing}`

  if (status.linked) {
    return (
      <Link
        to={`/${role}/profile`}
        className={`${baseClass} border-white/10 bg-white/[0.06] text-sky-300 hover:border-sky-300/30 hover:bg-sky-400/10`}
        aria-label="Telegram bot ulangan"
        title="Telegram bot ulangan"
      >
        <TelegramIcon sx={{ fontSize: 20 }} />
        <span className="absolute right-1.5 top-1.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-[#2a2559]" />
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={openPrompt}
      className={`${baseClass} border-sky-300/25 bg-sky-400/15 text-sky-200 hover:border-sky-300/40 hover:bg-sky-400/25 hover:text-white sm:flex sm:w-auto sm:gap-1.5 sm:px-3.5 sm:text-xs sm:font-bold`}
      aria-label="Telegram botga ulanish"
    >
      <TelegramIcon sx={{ fontSize: 20 }} />
      <span className="hidden sm:inline">Telegramga ulash</span>
      <span className="absolute right-1.5 top-1.5 size-2.5 animate-pulse rounded-full bg-rose-400 ring-2 ring-[#2a2559] motion-reduce:animate-none sm:-right-0.5 sm:-top-0.5" />
    </button>
  )
}

function RouteSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-[1600px] px-3 pb-5 sm:px-4 lg:px-5 lg:pb-6"
      role="status"
      aria-live="polite"
      aria-label="Sahifa yuklanmoqda"
    >
      <div className="theme-fixed mx-[calc(50%_-_50cqw)] bg-gradient-to-b from-[#2a2559] via-[#28235a] to-[#1d1a47] px-[calc(50cqw_-_50%)]">
        <div className="flex animate-pulse items-start gap-4 py-7 sm:py-8 lg:py-10">
          <div className="hidden size-[52px] shrink-0 rounded-2xl bg-white/10 sm:block" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-5 w-36 rounded-full bg-white/10" />
            <div className="h-8 w-64 max-w-full rounded-lg bg-white/15" />
            <div className="h-3.5 w-80 max-w-full rounded-full bg-white/10" />
          </div>
        </div>
      </div>
      <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card className="p-4" key={index}>
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-9 rounded-xl" />
              <Skeleton className="h-2.5 w-20" />
            </div>
            <Skeleton className="mt-3 h-6 w-14" />
          </Card>
        ))}
      </div>
      <Card className="mt-5 overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="divide-y divide-slate-100 px-5">
          {Array.from({ length: 5 }, (_, index) => (
            <div className="flex items-center gap-3 py-4" key={index}>
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-40 max-w-full" />
                <Skeleton className="h-2.5 w-56 max-w-full" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
