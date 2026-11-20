import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm, useWatch, type UseFormRegisterReturn } from 'react-hook-form'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import AlternateEmailRoundedIcon from '@mui/icons-material/AlternateEmailRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import ContrastRoundedIcon from '@mui/icons-material/ContrastRounded'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import KeyRoundedIcon from '@mui/icons-material/KeyRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import TelegramIcon from '@mui/icons-material/Telegram'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import SettingsBrightnessRoundedIcon from '@mui/icons-material/SettingsBrightnessRounded'
import { api } from '../lib/api'
import useAuth from '../hooks/useAuth'
import { useLessons } from '../hooks/useLessons'
import { useSubjects } from '../hooks/useSubjects'
import useToast from '../hooks/useToast'
import useTheme from '../hooks/useTheme'
import useTelegram from '../hooks/useTelegram'
import type { ThemePreference } from '../context/ThemeContext'
import type { Lesson, Role, User } from '../types'
import TelegramConnectCard from '../components/TelegramConnectCard'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card, { SectionHeader } from '../components/ui/Card'
import { FormField } from '../components/ui/Field'
import { inputBase } from '../components/ui/fieldStyles'
import { Skeleton } from '../components/ui/Skeleton'

interface PasswordValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

type TabId = 'overview' | 'security' | 'telegram' | 'appearance' | 'subjects'

interface TabItem {
  id: TabId
  label: string
  description: string
  icon: ReactNode
  status?: ReactNode
}

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  teacher: "O‘qituvchi",
  student: 'Talaba',
}

const STRENGTH = [
  { label: 'Hali kiritilmadi', text: 'text-slate-400', bar: 'bg-slate-200' },
  { label: 'Zaif', text: 'text-rose-600', bar: 'bg-rose-500' },
  { label: 'O‘rtacha', text: 'text-amber-600', bar: 'bg-amber-500' },
  { label: 'Yaxshi', text: 'text-emerald-600', bar: 'bg-emerald-500' },
] as const

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400'

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

/**
 * Profil boshqa bo'limlardan farqli: sahifa sarlavhasi o'rniga shaxsiy "muqova" kartasi,
 * ostida esa sozlamalar uslubidagi bo'limlar (tab). Tanlangan bo'lim `?tab=` orqali saqlanadi.
 */
export default function ProfilePage() {
  const { user, logout } = useAuth()
  const { status: telegramStatus } = useTelegram()
  const isTeacher = user?.role === 'teacher'
  const { data: lessons, isLoading: lessonsLoading } = useLessons(isTeacher)
  const { data: catalogSubjects, isLoading: catalogSubjectsLoading } = useSubjects(isTeacher)
  const [searchParams, setSearchParams] = useSearchParams()

  const scheduledSubjects = useMemo(() => {
    const map = new Map<string, { subject: Lesson['subject']; count: number }>()
    for (const lesson of lessons) {
      const entry = map.get(lesson.subject.id)
      if (entry) entry.count += 1
      else map.set(lesson.subject.id, { subject: lesson.subject, count: 1 })
    }
    return [...map.values()].sort((a, b) => b.count - a.count)
  }, [lessons])
  // Profil fanlari jadvaldan emas, o‘qituvchining hisobiga biriktirilgan ro‘yxatdan olinadi.
  const subjects = useMemo(() => {
    const scheduledCounts = new Map(scheduledSubjects.map(({ subject, count }) => [subject.id, count]))
    const assignedIds = new Set(user?.subjectIds || [])
    return catalogSubjects
      .filter((subject) => assignedIds.has(subject.id))
      .map((subject) => ({ subject, count: scheduledCounts.get(subject.id) || 0 }))
  }, [catalogSubjects, scheduledSubjects, user?.subjectIds])
  const groupCount = useMemo(
    () => new Set(lessons.flatMap((lesson) => lesson.groups.map((group) => group.id))).size,
    [lessons],
  )

  if (!user) return null

  const telegramLinked = Boolean(telegramStatus?.linked)
  const tabs: TabItem[] = [
    { id: 'overview', label: 'Shaxsiy ma’lumotlar', description: 'Ism, email va rol', icon: <PersonOutlineRoundedIcon sx={{ fontSize: 19 }} /> },
    { id: 'security', label: 'Xavfsizlik', description: 'Parolni yangilash', icon: <LockOutlinedIcon sx={{ fontSize: 19 }} /> },
    {
      id: 'telegram',
      label: 'Telegram',
      description: 'Bot orqali ulanish',
      icon: <TelegramIcon sx={{ fontSize: 19 }} />,
      status: telegramStatus ? (
        <span
          className={`size-2 rounded-full ${telegramLinked ? 'bg-emerald-500' : 'bg-amber-500 shadow-[0_0_0_3px_rgb(245_158_11/0.2)]'}`}
          title={telegramLinked ? 'Ulangan' : 'Ulanmagan'}
        />
      ) : undefined,
    },
    { id: 'appearance', label: 'Ko‘rinish', description: 'Kunduzgi va tungi rejim', icon: <ContrastRoundedIcon sx={{ fontSize: 19 }} /> },
    ...(isTeacher
      ? [{ id: 'subjects' as const, label: 'Fanlarim', description: 'Jadvaldagi fanlar', icon: <MenuBookRoundedIcon sx={{ fontSize: 19 }} /> }]
      : []),
  ]
  const requestedTab = searchParams.get('tab')
  const activeTab: TabId = tabs.some((tab) => tab.id === requestedTab) ? (requestedTab as TabId) : 'overview'

  function openTab(tab: TabId) {
    setSearchParams(tab === 'overview' ? {} : { tab }, { replace: true })
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pb-7 pt-5 sm:px-6 sm:pt-7 lg:px-10 lg:pb-9">
      <ProfileHero
        user={user}
        telegramLinked={telegramStatus ? telegramLinked : null}
        teacherStats={isTeacher ? { subjects: subjects.length, lessons: lessons.length, groups: groupCount, loading: lessonsLoading || catalogSubjectsLoading } : null}
        onChangePassword={() => openTab('security')}
        onLogout={logout}
      />

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[264px_minmax(0,1fr)]">
        <ProfileTabs tabs={tabs} active={activeTab} onChange={openTab} />

        <section key={activeTab} className="min-w-0 animate-fade-in" aria-label={tabs.find((tab) => tab.id === activeTab)?.label}>
          {activeTab === 'overview' && (
            <OverviewSection user={user} telegramLinked={telegramStatus ? telegramLinked : null} onOpenTab={openTab} />
          )}
          {activeTab === 'security' && <SecuritySection />}
          {activeTab === 'telegram' && <TelegramSection isTeacher={isTeacher} />}
          {activeTab === 'appearance' && <AppearanceSection />}
          {activeTab === 'subjects' && <SubjectsSection subjects={subjects} loading={lessonsLoading || catalogSubjectsLoading} />}
        </section>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Muqova kartasi                                                      */
/* ------------------------------------------------------------------ */

function ProfileHero({
  user,
  telegramLinked,
  teacherStats,
  onChangePassword,
  onLogout,
}: {
  user: User
  telegramLinked: boolean | null
  teacherStats: { subjects: number; lessons: number; groups: number; loading: boolean } | null
  onChangePassword: () => void
  onLogout: () => void
}) {
  const toast = useToast()

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(user.email)
      toast.success('Email nusxalandi.', 'Nusxalandi')
    } catch {
      toast.error('Nusxalab bo‘lmadi. Brauzer ruxsatini tekshiring.')
    }
  }

  const stats: { label: string; value: ReactNode; icon: ReactNode; tone: string }[] = [
    {
      label: 'Rol',
      value: ROLE_LABELS[user.role],
      icon: <ShieldOutlinedIcon sx={{ fontSize: 17 }} />,
      tone: 'bg-brand-50 text-brand-700',
    },
    ...(teacherStats
      ? [
          { label: 'Fanlar', value: teacherStats.loading ? '—' : teacherStats.subjects, icon: <MenuBookRoundedIcon sx={{ fontSize: 17 }} />, tone: 'bg-sky-50 text-sky-700' },
          { label: 'Darslar', value: teacherStats.loading ? '—' : teacherStats.lessons, icon: <CalendarMonthRoundedIcon sx={{ fontSize: 17 }} />, tone: 'bg-amber-50 text-amber-700' },
          { label: 'Guruhlar', value: teacherStats.loading ? '—' : teacherStats.groups, icon: <GroupsRoundedIcon sx={{ fontSize: 17 }} />, tone: 'bg-emerald-50 text-emerald-700' },
        ]
      : [
          ...(user.role === 'student'
            ? [{ label: 'Guruh', value: user.group?.name || 'Biriktirilmagan', icon: <GroupsRoundedIcon sx={{ fontSize: 17 }} />, tone: 'bg-amber-50 text-amber-700' }]
            : []),
          { label: 'Hisob holati', value: 'Faol', icon: <VerifiedUserOutlinedIcon sx={{ fontSize: 17 }} />, tone: 'bg-emerald-50 text-emerald-700' },
          {
            label: 'Telegram',
            value: telegramLinked === null ? '—' : telegramLinked ? 'Ulangan' : 'Ulanmagan',
            icon: <TelegramIcon sx={{ fontSize: 17 }} />,
            tone: 'bg-sky-50 text-sky-700',
          },
        ]),
  ]

  return (
    <Card className="overflow-hidden">
      <div className="theme-fixed relative h-28 overflow-hidden bg-gradient-to-br from-[#2a2559] via-[#3a2f86] to-[#5b46c9] sm:h-36">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
            maskImage: 'linear-gradient(to right, transparent, black 70%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 70%)',
          }}
          aria-hidden="true"
        />
        <svg
          className="pointer-events-none absolute -right-8 -top-16 h-72 w-72 text-white"
          viewBox="0 0 200 200"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="100" cy="100" r="92" stroke="currentColor" strokeOpacity="0.1" />
          <circle cx="100" cy="100" r="68" stroke="currentColor" strokeOpacity="0.14" strokeDasharray="2 6" />
          <circle cx="100" cy="100" r="44" stroke="currentColor" strokeOpacity="0.18" />
          <circle cx="100" cy="100" r="6" fill="currentColor" fillOpacity="0.35" />
          <circle cx="168" cy="140" r="4" fill="currentColor" fillOpacity="0.3" />
        </svg>
        <div className="pointer-events-none absolute -bottom-16 left-10 size-48 rounded-full bg-violet-400/30 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-1/2 rounded-full bg-fuchsia-400/15 blur-3xl" aria-hidden="true" />
        <span className="absolute left-5 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-violet-100 backdrop-blur sm:left-7 sm:top-5">
          <span className="size-1.5 rounded-full bg-violet-300 shadow-[0_0_8px_rgba(196,181,253,0.9)]" aria-hidden="true" />
          Shaxsiy kabinet
        </span>
      </div>

      <div className="px-5 pb-5 sm:px-7 sm:pb-6">
        <div className="flex items-end justify-between gap-3">
          <span className="relative -mt-12 grid size-24 shrink-0 place-items-center rounded-[28px] bg-gradient-to-br from-brand-500 to-indigo-600 font-display text-3xl font-black text-white shadow-lg shadow-brand-600/25 ring-[5px] ring-surface sm:-mt-14 sm:size-28 sm:text-4xl">
            {getInitials(user.name)}
            <span
              className="absolute -bottom-0.5 -right-0.5 size-5 rounded-full bg-emerald-500 ring-4 ring-surface"
              title="Faol"
              aria-hidden="true"
            />
          </span>
          <div className="flex flex-wrap justify-end gap-2 pt-3">
            <Button variant="secondary" size="sm" startIcon={<KeyRoundedIcon sx={{ fontSize: 16 }} />} onClick={onChangePassword}>
              <span className="hidden sm:inline">Parolni o‘zgartirish</span>
              <span className="sm:hidden">Parol</span>
            </Button>
            <Button variant="dangerSoft" size="sm" startIcon={<LogoutRoundedIcon sx={{ fontSize: 16 }} />} onClick={onLogout}>
              Chiqish
            </Button>
          </div>
        </div>

        <div className="mt-4 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="min-w-0 truncate font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[1.75rem]">
              {user.name}
            </h1>
            <Badge tone="brand">
              <ShieldOutlinedIcon sx={{ fontSize: 13 }} />
              {ROLE_LABELS[user.role]}
            </Badge>
          </div>
          <button
            type="button"
            className={`group mt-1 inline-flex max-w-full items-center gap-1.5 rounded-md text-sm text-slate-500 transition hover:text-brand-700 ${focusRing}`}
            onClick={() => void copyEmail()}
            title="Emailni nusxalash"
          >
            <AlternateEmailRoundedIcon sx={{ fontSize: 15 }} className="shrink-0 text-slate-400 group-hover:text-brand-600" />
            <span className="truncate">{user.email}</span>
            <ContentCopyRoundedIcon sx={{ fontSize: 13 }} className="shrink-0 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />
          </button>
        </div>

        <dl className={`mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-slate-200/70 ring-1 ring-slate-200/70 ${stats.length >= 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 bg-surface px-4 py-3.5">
              <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${stat.tone}`}>{stat.icon}</span>
              <div className="min-w-0">
                <dt className="truncate text-[11px] font-semibold uppercase tracking-wider text-slate-400">{stat.label}</dt>
                <dd className="truncate text-sm font-bold text-slate-900 sm:text-base">{stat.value}</dd>
              </div>
            </div>
          ))}
          {stats.length === 3 && <div className="bg-surface sm:hidden" aria-hidden="true" />}
        </dl>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Bo'limlar navigatsiyasi                                             */
/* ------------------------------------------------------------------ */

function ProfileTabs({ tabs, active, onChange }: { tabs: TabItem[]; active: TabId; onChange: (tab: TabId) => void }) {
  return (
    <nav aria-label="Profil bo‘limlari" className="lg:sticky lg:top-24">
      {/* Mobil: gorizontal aylanadigan tugmalar */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:hidden" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.id === active
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition ${focusRing} ${
                isActive
                  ? 'bg-brand-600 text-white shadow-glow'
                  : 'border border-slate-200 bg-surface text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => onChange(tab.id)}
            >
              {tab.icon}
              {tab.label}
              {tab.status}
            </button>
          )
        })}
      </div>

      {/* Desktop: sozlamalar menyusi */}
      <Card className="hidden p-2 lg:block">
        <div className="grid gap-1" role="tablist" aria-orientation="vertical">
          {tabs.map((tab) => {
            const isActive = tab.id === active
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${focusRing} ${
                  isActive ? 'bg-brand-50' : 'hover:bg-slate-50'
                }`}
                onClick={() => onChange(tab.id)}
              >
                {isActive && <span className="absolute inset-y-2.5 left-0 w-1 rounded-r-full bg-brand-600" aria-hidden="true" />}
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-lg transition ${
                    isActive ? 'bg-brand-600 text-white shadow-glow' : 'bg-slate-100 text-slate-500 group-hover:text-slate-700'
                  }`}
                >
                  {tab.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm font-semibold ${isActive ? 'text-brand-700' : 'text-slate-800'}`}>{tab.label}</span>
                  <span className="block truncate text-xs text-slate-400">{tab.description}</span>
                </span>
                {tab.status}
                <ChevronRightRoundedIcon
                  sx={{ fontSize: 18 }}
                  className={`shrink-0 transition ${isActive ? 'text-brand-500' : 'text-slate-300 group-hover:translate-x-0.5'}`}
                />
              </button>
            )
          })}
        </div>
      </Card>
    </nav>
  )
}

/* ------------------------------------------------------------------ */
/* Shaxsiy ma'lumotlar                                                 */
/* ------------------------------------------------------------------ */

function OverviewSection({
  user,
}: {
  user: User
  telegramLinked: boolean | null
  onOpenTab: (tab: TabId) => void
}) {
  return (
    <div className="grid gap-5">
      <Card className="p-3 sm:p-4">
        <SectionHeader
          icon={<PersonOutlineRoundedIcon sx={{ fontSize: 18 }} />}
          title="Shaxsiy ma’lumotlar"
          description="Tizimdagi hisobingiz shu ma’lumotlar bilan ko‘rinadi."
        />
        <dl className="mt-5 divide-y divide-slate-100 rounded-2xl ring-1 ring-inset ring-slate-200/70">
          <InfoRow icon={<BadgeOutlinedIcon sx={{ fontSize: 18 }} />} label="F.I.Sh." value={user.name} />
          <InfoRow icon={<AlternateEmailRoundedIcon sx={{ fontSize: 18 }} />} label="Email (login)" value={user.email} />
          <InfoRow icon={<ShieldOutlinedIcon sx={{ fontSize: 18 }} />} label="Rol" value={ROLE_LABELS[user.role]} />
          {user.role === 'student' && (
            <InfoRow icon={<GroupsRoundedIcon sx={{ fontSize: 18 }} />} label="Guruh" value={user.group?.name || 'Guruh biriktirilmagan'} />
          )}
          <InfoRow
            icon={<VerifiedUserOutlinedIcon sx={{ fontSize: 18 }} />}
            label="Hisob holati"
            value={
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgb(16_185_129/0.18)]" aria-hidden="true" />
                Faol
              </span>
            }
          />
        </dl>
        {user.role !== 'admin' && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
            <InfoOutlinedIcon sx={{ fontSize: 16 }} className="mt-px shrink-0 text-slate-400" />
            Ism, email yoki guruhni o‘zgartirish kerak bo‘lsa, administratorga murojaat qiling.
          </p>
        )}
      </Card>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4">
      <dt className="flex w-44 shrink-0 items-center gap-2.5 text-sm text-slate-500">
        <span className="text-slate-400">{icon}</span>
        {label}
      </dt>
      <dd className="min-w-0 break-words pl-7 text-sm font-semibold text-slate-900 sm:pl-0">{value}</dd>
    </div>
  )
}


/* ------------------------------------------------------------------ */
/* Xavfsizlik                                                          */
/* ------------------------------------------------------------------ */

function SecuritySection() {
  const toast = useToast()
  const {
    register,
    handleSubmit,
    getValues,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>()

  const newPassword = useWatch({ control, name: 'newPassword' }) || ''
  const confirmPassword = useWatch({ control, name: 'confirmPassword' }) || ''
  const currentPassword = useWatch({ control, name: 'currentPassword' }) || ''
  const checks = [
    { ok: newPassword.length >= 8, text: 'Kamida 8 ta belgi' },
    { ok: Boolean(newPassword) && newPassword !== currentPassword, text: 'Joriy paroldan farqli' },
    { ok: Boolean(confirmPassword) && confirmPassword === newPassword, text: 'Tasdiq paroli mos' },
  ]
  const score = checks.filter((check) => check.ok).length
  const strength = STRENGTH[score]

  async function onSubmit(values: PasswordValues) {
    try {
      await api<{ message: string }>('/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      })
      toast.success('Parol muvaffaqiyatli yangilandi.', 'Xavfsizlik')
      reset()
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Parolni yangilab bo‘lmadi.')
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-brand-500 via-violet-400 to-indigo-500" aria-hidden="true" />
      <div className="p-3 sm:p-4">
        <SectionHeader
          icon={<LockOutlinedIcon sx={{ fontSize: 18 }} />}
          title="Parolni yangilash"
          description="Xavfsizlik uchun kuchli va boshqa saytlarda ishlatilmagan paroldan foydalaning."
        />
        <form className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_260px]" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid content-start gap-4">
            <FormField label="Joriy parol" htmlFor="current-password" error={errors.currentPassword?.message}>
              <PasswordInput
                id="current-password"
                autoComplete="current-password"
                placeholder="Hozirgi parolingiz"
                registration={register('currentPassword', { required: 'Joriy parolni kiriting.' })}
              />
            </FormField>
            <FormField label="Yangi parol" htmlFor="new-password" error={errors.newPassword?.message}>
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                placeholder="Kamida 8 ta belgi"
                registration={register('newPassword', {
                  required: 'Yangi parolni kiriting.',
                  minLength: { value: 8, message: 'Parol kamida 8 ta belgidan iborat bo‘lsin.' },
                  validate: (value) =>
                    value !== getValues('currentPassword') || 'Yangi parol joriy paroldan farq qilishi kerak.',
                })}
              />
            </FormField>
            <FormField label="Yangi parolni tasdiqlang" htmlFor="confirm-password" error={errors.confirmPassword?.message}>
              <PasswordInput
                id="confirm-password"
                autoComplete="new-password"
                placeholder="Yangi parolni qayta kiriting"
                registration={register('confirmPassword', {
                  required: 'Yangi parolni qayta kiriting.',
                  validate: (value) => value === getValues('newPassword') || 'Parollar mos emas.',
                })}
              />
            </FormField>
            <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-400">Keyingi kirishda yangi paroldan foydalanasiz.</p>
              <Button type="submit" loading={isSubmitting} loadingText="Saqlanmoqda..." startIcon={<CheckCircleRoundedIcon sx={{ fontSize: 18 }} />}>
                Parolni saqlash
              </Button>
            </div>
          </div>

          {/* Talablar va kuchlilik ko'rsatkichi */}
          <aside className="h-fit rounded-2xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200/70 md:mt-7">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Parol talablari</span>
              <span className={`font-bold ${strength.text}`} aria-live="polite">
                {strength.label}
              </span>
            </div>
            <div className="mt-2.5 grid grid-cols-3 gap-1.5" aria-hidden="true">
              {checks.map((check, index) => (
                <span
                  key={check.text}
                  className={`h-1.5 rounded-full transition-colors duration-300 motion-reduce:transition-none ${
                    index < score ? strength.bar : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <ul className="mt-3.5 grid gap-2">
              {checks.map((check) => (
                <li
                  key={check.text}
                  className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                    check.ok ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  {check.ok ? (
                    <CheckCircleRoundedIcon sx={{ fontSize: 16 }} />
                  ) : (
                    <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 16 }} className="text-slate-300" />
                  )}
                  {check.text}
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-slate-200/70 pt-3 text-[11px] leading-5 text-slate-400">
              Maslahat: harflar, raqamlar va belgilarni aralashtiring — masalan, uchta tasodifiy so‘z.
            </p>
          </aside>
        </form>
      </div>
    </Card>
  )
}

function PasswordInput({
  id,
  autoComplete,
  placeholder,
  registration,
}: {
  id: string
  autoComplete: string
  placeholder?: string
  registration: UseFormRegisterReturn
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative mt-2">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={`${inputBase} h-12 pr-12`}
        {...registration}
      />
      <button
        type="button"
        className={`absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 ${focusRing}`}
        aria-label={visible ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} /> : <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />}
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Telegram                                                            */
/* ------------------------------------------------------------------ */

function TelegramSection({ isTeacher }: { isTeacher: boolean }) {
  const features = [
    { icon: <CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />, title: 'Dars jadvali', text: 'Jadvalingizni bot orqali tez ko‘ring.' },
    ...(isTeacher
      ? [{ icon: <NotificationsActiveOutlinedIcon sx={{ fontSize: 18 }} />, title: 'Bildirishnomalar', text: 'Dars qo‘shilsa, o‘zgarsa yoki o‘chirilsa xabar keladi.' }]
      : []),
    { icon: <VerifiedUserOutlinedIcon sx={{ fontSize: 18 }} />, title: 'Xavfsiz ulanish', text: 'Bir martalik havola — Telegram parolingiz so‘ralmaydi.' },
  ]

  return (
    <div className="grid gap-5">
      <TelegramConnectCard />
      <Card className="p-3 sm:p-4">
        <h3 className="text-sm font-bold text-slate-900">Bot nima beradi?</h3>
        <ul className={`mt-4 grid gap-3 ${features.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
          {features.map((feature) => (
            <li key={feature.title} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200/70">
              <span className="grid size-9 place-items-center rounded-xl bg-sky-50 text-sky-700">{feature.icon}</span>
              <strong className="mt-3 block text-sm font-semibold text-slate-800">{feature.title}</strong>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{feature.text}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Ko'rinish                                                           */
/* ------------------------------------------------------------------ */

const THEME_OPTIONS: { value: ThemePreference; label: string; text: string; icon: ReactNode }[] = [
  { value: 'light', label: 'Kunduzgi', text: 'Yorug‘ fon', icon: <LightModeRoundedIcon sx={{ fontSize: 17 }} /> },
  { value: 'dark', label: 'Tungi', text: 'Ko‘zni charchatmaydi', icon: <DarkModeRoundedIcon sx={{ fontSize: 17 }} /> },
  { value: 'system', label: 'Tizim', text: 'Qurilmaga moslashadi', icon: <SettingsBrightnessRoundedIcon sx={{ fontSize: 17 }} /> },
]

function AppearanceSection() {
  const { preference, theme, setPreference } = useTheme()

  return (
    <Card className="p-3 sm:p-4">
      <SectionHeader
        icon={<ContrastRoundedIcon sx={{ fontSize: 18 }} />}
        title="Ko‘rinish"
        description="Interfeys uchun qulay rejimni tanlang. Tanlov shu brauzerda saqlanadi."
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Ko‘rinish rejimi">
        {THEME_OPTIONS.map((option) => {
          const active = preference === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              className={`group rounded-2xl p-2 text-left transition ${focusRing} ${
                active ? 'bg-brand-50 ring-2 ring-brand-500' : 'ring-1 ring-slate-200 hover:ring-slate-300'
              }`}
              onClick={() => setPreference(option.value)}
            >
              <ThemePreview variant={option.value} />
              <span className="flex items-center gap-2.5 px-1.5 pb-1 pt-3">
                <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {option.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-semibold ${active ? 'text-brand-700' : 'text-slate-800'}`}>{option.label}</span>
                  <span className="block truncate text-xs text-slate-400">{option.text}</span>
                </span>
                {active ? (
                  <CheckCircleRoundedIcon sx={{ fontSize: 20 }} className="shrink-0 text-brand-600" />
                ) : (
                  <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 20 }} className="shrink-0 text-slate-300" />
                )}
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-4 text-xs text-slate-400">
        {preference === 'system'
          ? `Qurilma sozlamasiga moslashadi (hozir ${theme === 'dark' ? 'tungi' : 'kunduzgi'}).`
          : 'Headerdagi oy/quyosh tugmasi orqali ham tez almashtirish mumkin.'}
      </p>
    </Card>
  )
}

const PREVIEW_PALETTES = {
  light: { bg: '#f3f4fa', panel: '#ffffff', sidebar: '#2a2559', line: '#e2e5f0', accent: '#6a3ce0', soft: '#ebe7ff' },
  dark: { bg: '#15132e', panel: '#1f1c40', sidebar: '#0f0d24', line: '#312d57', accent: '#9d82ff', soft: '#2d2660' },
}

/** Rejimning kichik "skrinshoti" — ranglar ataylab qat'iy, joriy mavzuga bog'liq emas. */
function ThemePreview({ variant }: { variant: ThemePreference }) {
  return (
    <span className="relative block aspect-[16/10] overflow-hidden rounded-xl ring-1 ring-black/5" aria-hidden="true">
      <PreviewMock palette={PREVIEW_PALETTES[variant === 'dark' ? 'dark' : 'light']} />
      {variant === 'system' && (
        <span className="absolute inset-0" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}>
          <PreviewMock palette={PREVIEW_PALETTES.dark} />
        </span>
      )}
    </span>
  )
}

function PreviewMock({ palette }: { palette: (typeof PREVIEW_PALETTES)['light'] }) {
  const bar = (width: string, color: string, extra: CSSProperties = {}) => (
    <span className="block h-1.5 rounded-full" style={{ width, backgroundColor: color, ...extra }} />
  )
  return (
    <span className="absolute inset-0 flex" style={{ backgroundColor: palette.bg }}>
      <span className="flex w-[26%] flex-col gap-1.5 p-2" style={{ backgroundColor: palette.sidebar }}>
        <span className="mb-1 block size-3 rounded" style={{ backgroundColor: palette.accent }} />
        {bar('80%', 'rgba(255,255,255,0.28)')}
        {bar('65%', 'rgba(255,255,255,0.16)')}
        {bar('72%', 'rgba(255,255,255,0.16)')}
      </span>
      <span className="flex flex-1 flex-col gap-2 p-2.5">
        {bar('45%', palette.line, { height: 8 })}
        <span className="grid flex-1 grid-cols-2 gap-2">
          <span className="flex flex-col gap-1.5 rounded-md p-1.5" style={{ backgroundColor: palette.panel }}>
            <span className="block size-3 rounded" style={{ backgroundColor: palette.soft }} />
            {bar('85%', palette.line)}
            {bar('60%', palette.line)}
          </span>
          <span className="flex flex-col gap-1.5 rounded-md p-1.5" style={{ backgroundColor: palette.panel }}>
            <span className="block size-3 rounded" style={{ backgroundColor: palette.accent }} />
            {bar('70%', palette.line)}
            {bar('50%', palette.line)}
          </span>
        </span>
      </span>
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Fanlarim (o'qituvchi)                                               */
/* ------------------------------------------------------------------ */

function SubjectsSection({
  subjects,
  loading,
}: {
  subjects: { subject: Lesson['subject']; count: number }[]
  loading: boolean
}) {
  return (
    <Card className="p-3 sm:p-4">
      <SectionHeader
        icon={<MenuBookRoundedIcon sx={{ fontSize: 18 }} />}
        title="Fanlarim"
        description="Hisobingizga administrator biriktirgan fanlar."
        action={<Badge tone="brand">{subjects.length} ta fan</Badge>}
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {loading ? (
          <>
            <Skeleton className="h-[72px] rounded-2xl" />
            <Skeleton className="h-[72px] rounded-2xl" />
            <Skeleton className="h-[72px] rounded-2xl" />
          </>
        ) : subjects.length ? (
          subjects.map(({ subject, count }) => (
            <div
              key={subject.id}
              className="flex items-center gap-3 rounded-2xl p-3.5 ring-1 ring-inset ring-slate-200/80"
              style={{ backgroundColor: `color-mix(in srgb, ${subject.color} 8%, var(--color-surface))` }}
            >
              <span
                className="grid size-11 shrink-0 place-items-center rounded-xl text-base font-bold text-white shadow-sm"
                style={{ backgroundColor: subject.color }}
              >
                {subject.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm font-semibold text-slate-800">{subject.name}</strong>
                <small className="mt-0.5 block text-xs text-slate-500">{count ? `${count} ta dars jadvalda` : 'Jadvalga hali qo‘yilmagan'}</small>
              </span>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-500 sm:col-span-2">
            Sizga hali fan biriktirilmagan. Administrator “Hisoblar” bo‘limida fanlarni biriktirishi mumkin.
          </p>
        )}
      </div>
    </Card>
  )
}
