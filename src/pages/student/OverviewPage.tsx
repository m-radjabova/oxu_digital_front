import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import TodayRoundedIcon from '@mui/icons-material/TodayRounded'
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import useAuth from '../../hooks/useAuth'
import useNow from '../../hooks/useNow'
import { useLessons } from '../../hooks/useLessons'
import { useMyAttendance } from '../../hooks/useMyAttendance'
import { formatDate, startOfWeek, toDateKey, weekdayNumber } from '../../utils/date'
import { periodRange } from '../../utils/periods'
import { countByDay, findUpcomingLesson, lessonsOfDay } from '../../utils/schedule'
import DashboardHero from '../../components/dashboard/DashboardHero'
import NextLessonCard from '../../components/dashboard/NextLessonCard'
import StatCard from '../../components/dashboard/StatCard'
import LessonTimeline from '../../components/dashboard/LessonTimeline'
import WeekBars from '../../components/dashboard/WeekBars'
import ProgressRing from '../../components/dashboard/ProgressRing'
import QuickActions from '../../components/dashboard/QuickActions'
import { heroActionClass, heroPrimaryActionClass, subjectColor } from '../../components/dashboard/styles'
import TelegramBanner from '../../components/TelegramBanner'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { buttonClass } from '../../components/ui/buttonStyles'
import Card, { SectionHeader } from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton, SkeletonRows } from '../../components/ui/Skeleton'

export default function StudentOverviewPage() {
  const { user } = useAuth()
  const now = useNow()
  const weekStart = toDateKey(startOfWeek(now))
  const today = weekdayNumber(now)

  const { data: fetched, isLoading, error, refresh } = useLessons(true, { weekStart })
  const lessons = useMemo(() => fetched.filter((lesson) => lesson.weekStart === weekStart), [fetched, weekStart])
  const { data: records, isLoading: attendanceLoading } = useMyAttendance()

  const todayLessons = useMemo(() => lessonsOfDay(lessons, today), [lessons, today])
  const upcoming = useMemo(() => findUpcomingLesson(lessons, now), [lessons, now])
  const counts = useMemo(() => countByDay(lessons), [lessons])

  const total = records.length
  const present = records.filter((record) => record.status === 'present').length
  const absent = total - present
  const rate = total ? Math.round((present / total) * 100) : 0

  const bySubject = useMemo(() => {
    const map = new Map<string, { name: string; color: string; present: number; total: number }>()
    for (const record of records) {
      const key = record.lesson.subject.name
      const item = map.get(key) || { name: key, color: record.lesson.subject.color, present: 0, total: 0 }
      item.total += 1
      if (record.status === 'present') item.present += 1
      map.set(key, item)
    }
    return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 5)
  }, [records])

  const firstLoad = isLoading && !fetched.length
  const attendanceFirstLoad = attendanceLoading && !total

  if (!user) return null

  const subtitle = todayLessons.length
    ? `Bugun ${todayLessons.length} ta darsingiz bor. Omad tilaymiz!`
    : 'Bugun darslar yo‘q — dam oling yoki haftalik jadvalni ko‘rib chiqing.'

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-4 px-3 pb-5 sm:px-4 lg:px-5 lg:pb-6">
      <DashboardHero
        name={user.name}
        now={now}
        subtitle={subtitle}
        badge={
          <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">
            {user.group?.name ? `${user.group.name} guruhi` : 'Talaba'}
          </span>
        }
        actions={
          <>
            <Link to="/student/schedule" className={heroPrimaryActionClass}>
              <CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />
              Dars jadvali
            </Link>
            <Link to="/student/attendance" className={heroActionClass}>
              <FactCheckRoundedIcon sx={{ fontSize: 18 }} />
              Davomatim
            </Link>
          </>
        }
        aside={<NextLessonCard upcoming={upcoming} loading={firstLoad} showTeacher />}
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
        <StatCard icon={<TodayRoundedIcon />} label="Bugungi darslar" value={todayLessons.length} hint={todayLessons.length ? 'Jadval bo‘yicha' : 'Bugun bo‘sh kun'} tone="brand" loading={firstLoad} />
        <StatCard icon={<EventNoteRoundedIcon />} label="Shu haftada" value={lessons.length} hint="Jami darslar" tone="sky" to="/student/schedule" loading={firstLoad} delay={60} />
        <StatCard
          icon={<InsightsRoundedIcon />}
          label="Davomat ko‘rsatkichi"
          value={total ? `${rate}%` : '—'}
          hint={total ? `${total} ta dars bo‘yicha` : 'Hali ma’lumot yo‘q'}
          tone={!total || rate >= 80 ? 'emerald' : rate >= 60 ? 'amber' : 'rose'}
          to="/student/attendance"
          loading={attendanceFirstLoad}
          delay={120}
        />
        <StatCard icon={<EventBusyRoundedIcon />} label="Qoldirilgan darslar" value={absent} hint={absent ? 'Sababsiz qoldirmang' : 'Ajoyib natija!'} tone="rose" loading={attendanceFirstLoad} delay={180} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-6">
        <div className="grid content-start gap-5 lg:gap-6">
          <Card className="p-3 sm:p-4">
            <SectionHeader
              icon={<TodayRoundedIcon sx={{ fontSize: 20 }} />}
              title="Bugungi darslar"
              description={user.group?.name ? `${user.group.name} guruhi jadvali` : undefined}
              action={<Link to="/student/schedule" className={buttonClass({ variant: 'ghost', size: 'sm' })}>Barchasi <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} /></Link>}
            />
            <div className="mt-5">
              {firstLoad ? (
                <SkeletonRows rows={3} />
              ) : todayLessons.length ? (
                <LessonTimeline lessons={todayLessons} now={now} showTeacher showGroups={false} />
              ) : (
                <EmptyState
                  icon={<TodayRoundedIcon />}
                  title="Bugun darslar yo‘q"
                  description={user.group ? 'Haftalik jadvalda keyingi darslaringizni ko‘ring.' : 'Siz hali guruhga biriktirilmagansiz. Administratorga murojaat qiling.'}
                  action={<Link to="/student/schedule" className={buttonClass({ variant: 'secondary', size: 'sm' })}>Jadvalni ochish</Link>}
                />
              )}
            </div>
          </Card>

          <Card className="p-3 sm:p-4">
            <SectionHeader
              icon={<HistoryRoundedIcon sx={{ fontSize: 20 }} />}
              title="So‘nggi davomat"
              action={<Link to="/student/attendance" className={buttonClass({ variant: 'ghost', size: 'sm' })}>Barchasi <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} /></Link>}
            />
            <div className="mt-3">
              {attendanceFirstLoad ? (
                <SkeletonRows rows={3} />
              ) : total ? (
                <ul className="divide-y divide-slate-100">
                  {records.slice(0, 5).map((record) => (
                    <li key={record.id} className="flex items-center gap-3 py-3">
                      <span
                        className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                          record.status === 'present' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {record.status === 'present' ? <CheckCircleRoundedIcon sx={{ fontSize: 20 }} /> : <CancelRoundedIcon sx={{ fontSize: 20 }} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block truncate text-sm font-semibold text-slate-900">{record.lesson.subject.name}</b>
                        <small className="block truncate text-xs text-slate-500">
                          {formatDate(record.date)} · {record.lesson.period}-para · {periodRange(record.lesson.period)}
                        </small>
                      </span>
                      <Badge tone={record.status === 'present' ? 'success' : 'danger'}>
                        {record.status === 'present' ? 'Keldi' : 'Kelmadi'}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={<FactCheckRoundedIcon />} title="Davomat hali olinmagan" description="O‘qituvchi davomat belgilagach shu yerda ko‘rinadi." />
              )}
            </div>
          </Card>
        </div>

        <div className="grid content-start gap-5 lg:gap-6">
          <Card className="p-3 sm:p-4">
            <SectionHeader icon={<InsightsRoundedIcon sx={{ fontSize: 20 }} />} title="Davomat holati" />
            {attendanceFirstLoad ? (
              <div className="mt-5 flex items-center gap-5">
                <Skeleton className="size-32 rounded-full" />
                <div className="flex-1 space-y-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-3 w-20" /></div>
              </div>
            ) : (
              <>
                <div className="mt-5 flex items-center gap-5">
                  <ProgressRing
                    value={rate}
                    color={total ? undefined : 'var(--color-slate-300)'}
                    label={
                      <span>
                        <b className="block font-display text-2xl font-bold text-slate-900">{total ? `${rate}%` : '—'}</b>
                        <small className="text-[11px] font-semibold text-slate-400">davomat</small>
                      </span>
                    }
                  />
                  <ul className="grid flex-1 gap-2.5 text-sm">
                    <li className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-slate-600"><span className="size-2.5 rounded-full bg-emerald-500" />Keldi</span>
                      <b className="text-slate-900">{present}</b>
                    </li>
                    <li className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-slate-600"><span className="size-2.5 rounded-full bg-rose-500" />Kelmadi</span>
                      <b className="text-slate-900">{absent}</b>
                    </li>
                    <li className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                      <span className="text-slate-500">Jami</span>
                      <b className="text-slate-900">{total}</b>
                    </li>
                  </ul>
                </div>
                {bySubject.length > 0 && (
                  <ul className="mt-6 grid gap-3.5">
                    {bySubject.map((subject) => {
                      const percent = Math.round((subject.present / subject.total) * 100)
                      return (
                        <li key={subject.name}>
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-slate-700">
                              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: subjectColor(subject.color) }} />
                              <span className="truncate">{subject.name}</span>
                            </span>
                            <span className="shrink-0 font-bold text-slate-500">{percent}%</span>
                          </div>
                          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                            <span
                              className="block h-full rounded-full transition-all duration-700"
                              style={{ width: `${percent}%`, backgroundColor: subjectColor(subject.color) }}
                            />
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </>
            )}
          </Card>

          <Card className="p-3 sm:p-4">
            <SectionHeader icon={<BarChartRoundedIcon sx={{ fontSize: 20 }} />} title="Haftalik darslar" action={<Badge tone="brand">{lessons.length} ta</Badge>} />
            <div className="mt-5"><WeekBars counts={counts} today={today} height={110} /></div>
          </Card>

          <Card className="p-3 sm:p-4">
            <SectionHeader icon={<BoltRoundedIcon sx={{ fontSize: 20 }} />} title="Tezkor amallar" />
            <div className="mt-3">
              <QuickActions
                items={[
                  { to: '/student/schedule', icon: <CalendarMonthRoundedIcon sx={{ fontSize: 20 }} />, title: 'Dars jadvali', text: 'Haftalik darslar', tone: 'brand' },
                  { to: '/student/attendance', icon: <FactCheckRoundedIcon sx={{ fontSize: 20 }} />, title: 'Davomatim', text: 'Barcha natijalar', tone: 'emerald' },
                  { to: '/student/profile', icon: <AccountCircleRoundedIcon sx={{ fontSize: 20 }} />, title: 'Profil va sozlamalar', text: 'Parol, Telegram ulanishi', tone: 'sky' },
                ]}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
