import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import TodayRoundedIcon from '@mui/icons-material/TodayRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import DonutSmallRoundedIcon from '@mui/icons-material/DonutSmallRounded'
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded'
import PlayCircleRoundedIcon from '@mui/icons-material/PlayCircleRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import useAuth from '../../hooks/useAuth'
import useNow from '../../hooks/useNow'
import { useLessons } from '../../hooks/useLessons'
import { useGroups } from '../../hooks/useGroups'
import { useSubjects } from '../../hooks/useSubjects'
import { api } from '../../lib/api'
import { startOfWeek, toDateKey, weekdayNumber } from '../../utils/date'
import { LESSON_TYPES } from '../../utils/lessons'
import { periodStatus } from '../../utils/periods'
import { countByDay, lessonsOfDay } from '../../utils/schedule'
import DashboardHero from '../../components/dashboard/DashboardHero'
import StatCard from '../../components/dashboard/StatCard'
import LessonTimeline from '../../components/dashboard/LessonTimeline'
import WeekBars from '../../components/dashboard/WeekBars'
import QuickActions from '../../components/dashboard/QuickActions'
import { heroActionClass, heroPrimaryActionClass, subjectColor } from '../../components/dashboard/styles'
import TelegramBanner from '../../components/TelegramBanner'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { buttonClass } from '../../components/ui/buttonStyles'
import Card, { SectionHeader } from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonRows } from '../../components/ui/Skeleton'

const TIMELINE_LIMIT = 8
const TYPE_COLORS: Record<string, string> = { lecture: '#6a3ce0', practice: '#0ea5e9', lab: '#f59e0b' }

interface Totals {
  teachers: number
  students: number
}

function useAccountTotals() {
  const [totals, setTotals] = useState<Totals | null>(null)
  useEffect(() => {
    let active = true
    Promise.all([
      api<{ total: number }>('/users?role=teacher&page=1&limit=1'),
      api<{ total: number }>('/users?role=student&page=1&limit=1'),
    ])
      .then(([teachers, students]) => {
        if (active) setTotals({ teachers: teachers.total, students: students.total })
      })
      .catch(() => {
        if (active) setTotals({ teachers: 0, students: 0 })
      })
    return () => { active = false }
  }, [])
  return totals
}

export default function AdminOverviewPage() {
  const { user } = useAuth()
  const now = useNow()
  const weekStart = toDateKey(startOfWeek(now))
  const today = weekdayNumber(now)

  const [progressAlerts, setProgressAlerts] = useState<{ subject: string; group: string; hours: number; maximum: number }[]>([])
  useEffect(() => {
    let active = true
    api<typeof progressAlerts>('/subjects/progress-alerts').then((items) => { if (active) setProgressAlerts(items) }).catch(() => {})
    return () => { active = false }
  }, [])
  const totals = useAccountTotals()
  const { data: groups, isLoading: groupsLoading } = useGroups()
  const { data: subjects, isLoading: subjectsLoading } = useSubjects()
  const { data: fetched, isLoading, error, refresh } = useLessons(true, { weekStart })
  const lessons = useMemo(() => fetched.filter((lesson) => lesson.weekStart === weekStart), [fetched, weekStart])

  const todayLessons = useMemo(() => lessonsOfDay(lessons, today), [lessons, today])
  const liveLessons = todayLessons.filter((lesson) => periodStatus(lesson.period, now) === 'live')
  const remaining = todayLessons.filter((lesson) => periodStatus(lesson.period, now) !== 'done')
  const timelineLessons = (remaining.length ? remaining : todayLessons).slice(0, TIMELINE_LIMIT)
  const hiddenCount = (remaining.length ? remaining.length : todayLessons.length) - timelineLessons.length
  const counts = useMemo(() => countByDay(lessons), [lessons])
  const activeGroups = groups.filter((group) => group.isActive !== false).length

  const typeStats = LESSON_TYPES.map((type) => ({
    ...type,
    count: lessons.filter((lesson) => lesson.type === type.value).length,
  }))

  const topSubjects = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string; count: number }>()
    for (const lesson of lessons) {
      const item = map.get(lesson.subject.id) || { ...lesson.subject, count: 0 }
      item.count += 1
      map.set(lesson.subject.id, item)
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 5)
  }, [lessons])
  const topMax = Math.max(1, ...topSubjects.map((subject) => subject.count))

  const firstLoad = isLoading && !fetched.length

  if (!user) return null

  const subtitle = todayLessons.length
    ? `Bugun jami ${todayLessons.length} ta dars rejalashtirilgan${liveLessons.length ? `, hozir ${liveLessons.length} tasi davom etmoqda` : ''}.`
    : 'Bugun uchun darslar rejalashtirilmagan. Jadvalni boshqarish bo‘limidan dars qo‘shishingiz mumkin.'

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-4 px-3 pb-5 sm:px-4 lg:px-5 lg:pb-6">
      {progressAlerts.length > 0 && (
        <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-bold">Guruhlar orasida o‘tilgan soatlar farqi bor</p>
          <p className="mt-1 text-xs">Bir fanga biriktirilgan guruhlarning bugungacha jadvaldagi soatlari solishtirildi.</p>
          <ul className="mt-2 space-y-1">{progressAlerts.map((item) => <li key={`${item.subject}-${item.group}`}>{item.group} · {item.subject}: {item.hours} soat, eng ko‘p o‘tgan guruhda {item.maximum} soat</li>)}</ul>
        </div>
      )}
      <DashboardHero
        name={user.name}
        now={now}
        subtitle={subtitle}
        badge={<span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">Administrator</span>}
        actions={
          <>
            <Link to="/admin/schedule" className={heroPrimaryActionClass}>
              <CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />
              Jadvalni boshqarish
            </Link>
            <Link to="/admin/accounts" className={heroActionClass}>
              <PersonAddAltRoundedIcon sx={{ fontSize: 18 }} />
              Hisob qo‘shish
            </Link>
          </>
        }
        aside={
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md sm:p-4">
            {[
              { icon: <PlayCircleRoundedIcon sx={{ fontSize: 20 }} />, value: liveLessons.length, label: 'Hozir darsda' },
              { icon: <MeetingRoomRoundedIcon sx={{ fontSize: 20 }} />, value: new Set(liveLessons.map((lesson) => lesson.room).filter(Boolean)).size, label: 'Band xona' },
              { icon: <TodayRoundedIcon sx={{ fontSize: 20 }} />, value: remaining.length, label: 'Qolgan dars' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-white/10 p-3 text-center">
                <span className="mx-auto grid size-9 place-items-center rounded-xl bg-white/15">{item.icon}</span>
                <b className="mt-2 block font-display text-2xl font-bold">{firstLoad ? '…' : item.value}</b>
                <small className="block text-[11px] font-medium text-brand-100">{item.label}</small>
              </div>
            ))}
          </div>
        }
      />

      <TelegramBanner />

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <span className="flex items-center gap-2"><ErrorOutlineRoundedIcon sx={{ fontSize: 18 }} />{error}</span>
          <Button variant="dangerSoft" size="sm" startIcon={<RefreshRoundedIcon sx={{ fontSize: 16 }} />} onClick={() => void refresh()}>
            Qayta urinish
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard icon={<SchoolRoundedIcon />} label="O‘qituvchilar" value={totals?.teachers ?? 0} hint="Faol va nofaol hisoblar" tone="brand" to="/admin/accounts" loading={!totals} />
        <StatCard icon={<PeopleAltRoundedIcon />} label="Talabalar" value={totals?.students ?? 0} hint="Barcha guruhlarda" tone="sky" to="/admin/accounts" loading={!totals} delay={60} />
        <StatCard icon={<GroupsRoundedIcon />} label="Faol guruhlar" value={activeGroups} hint={`Jami ${groups.length} ta guruh`} tone="indigo" to="/admin/groups" loading={groupsLoading && !groups.length} delay={120} />
        <StatCard icon={<MenuBookRoundedIcon />} label="Fanlar" value={subjects.length} hint={`Shu hafta ${lessons.length} ta dars`} tone="emerald" to="/admin/subjects" loading={subjectsLoading && !subjects.length} delay={180} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-6">
        <Card className="p-3 sm:p-4">
          <SectionHeader
            icon={<TodayRoundedIcon sx={{ fontSize: 20 }} />}
            title="Bugungi darslar"
            description={remaining.length ? 'Davom etayotgan va kutilayotgan darslar' : 'Bugungi barcha darslar'}
            action={<Link to="/admin/schedule" className={buttonClass({ variant: 'ghost', size: 'sm' })}>Jadval <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} /></Link>}
          />
          <div className="mt-5">
            {firstLoad ? (
              <SkeletonRows rows={4} />
            ) : timelineLessons.length ? (
              <>
                <LessonTimeline lessons={timelineLessons} now={now} showTeacher />
                {hiddenCount > 0 && (
                  <Link
                    to="/admin/schedule"
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-slate-200 py-3 text-sm font-semibold text-brand-700 transition hover:border-brand-200 hover:bg-brand-50/50"
                  >
                    Yana {hiddenCount} ta darsni jadvalda ko‘rish
                    <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
                  </Link>
                )}
              </>
            ) : (
              <EmptyState
                icon={<TodayRoundedIcon />}
                title="Bugun darslar yo‘q"
                description="Haftalik jadvalga dars qo‘shib, guruhlar uchun jadval tuzing."
                action={<Link to="/admin/schedule" className={buttonClass({ variant: 'primary', size: 'sm' })}>Dars qo‘shish</Link>}
              />
            )}
          </div>
        </Card>

        <div className="grid content-start gap-5 lg:gap-6">
          <Card className="p-3 sm:p-4">
            <SectionHeader
              icon={<BarChartRoundedIcon sx={{ fontSize: 20 }} />}
              title="Haftalik yuklama"
              description="Kunlar bo‘yicha darslar soni"
              action={<Badge tone="brand">{lessons.length} ta dars</Badge>}
            />
            <div className="mt-5"><WeekBars counts={counts} today={today} height={120} /></div>
          </Card>

          <Card className="p-3 sm:p-4">
            <SectionHeader icon={<DonutSmallRoundedIcon sx={{ fontSize: 20 }} />} title="Dars turlari va fanlar" description="Shu hafta bo‘yicha" />
            <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-slate-100">
              {lessons.length > 0 && typeStats.map((type) => (
                <span
                  key={type.value}
                  className="h-full transition-all duration-700"
                  style={{ width: `${(type.count / lessons.length) * 100}%`, backgroundColor: TYPE_COLORS[type.value] }}
                />
              ))}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
              {typeStats.map((type) => (
                <li key={type.value} className="inline-flex items-center gap-1.5 text-slate-600">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[type.value] }} />
                  {type.label} <b className="text-slate-900">{type.count}</b>
                </li>
              ))}
            </ul>

            {topSubjects.length > 0 ? (
              <ul className="mt-6 grid gap-3.5 border-t border-slate-100 pt-5">
                {topSubjects.map((subject) => (
                  <li key={subject.id}>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-slate-700">
                        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: subjectColor(subject.color) }} />
                        <span className="truncate">{subject.name}</span>
                      </span>
                      <span className="shrink-0 font-bold text-slate-500">{subject.count} ta</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                      <span
                        className="block h-full rounded-full transition-all duration-700"
                        style={{ width: `${(subject.count / topMax) * 100}%`, backgroundColor: subjectColor(subject.color) }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 text-sm text-slate-400">Shu hafta uchun darslar hali qo‘shilmagan.</p>
            )}
          </Card>

          <Card className="p-3 sm:p-4">
            <SectionHeader icon={<BoltRoundedIcon sx={{ fontSize: 20 }} />} title="Tezkor amallar" />
            <div className="mt-3">
              <QuickActions
                items={[
                  { to: '/admin/schedule', icon: <CalendarMonthRoundedIcon sx={{ fontSize: 20 }} />, title: 'Dars jadvali', text: 'Dars qo‘shish va tahrirlash', tone: 'brand' },
                  { to: '/admin/accounts', icon: <PersonAddAltRoundedIcon sx={{ fontSize: 20 }} />, title: 'Hisoblar', text: 'O‘qituvchi va talabalar', tone: 'sky' },
                  { to: '/admin/groups', icon: <GroupsRoundedIcon sx={{ fontSize: 20 }} />, title: 'Guruhlar', text: 'Guruh yaratish va boshqarish', tone: 'indigo' },
                  { to: '/admin/subjects', icon: <MenuBookRoundedIcon sx={{ fontSize: 20 }} />, title: 'Fanlar', text: 'Fanlar ro‘yxati va ranglari', tone: 'emerald' },
                ]}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
