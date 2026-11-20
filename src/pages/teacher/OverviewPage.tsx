import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded'
import TodayRoundedIcon from '@mui/icons-material/TodayRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import useAuth from '../../hooks/useAuth'
import useNow from '../../hooks/useNow'
import { useLessons } from '../../hooks/useLessons'
import { useSubjects } from '../../hooks/useSubjects'
import { useAttendanceStatuses } from '../../hooks/useAttendanceStatuses'
import { startOfWeek, toDateKey, weekdayNumber, tashkentWallTime } from '../../utils/date'
import { countByDay, findUpcomingLesson, lessonsOfDay } from '../../utils/schedule'
import DashboardHero from '../../components/dashboard/DashboardHero'
import NextLessonCard from '../../components/dashboard/NextLessonCard'
import StatCard from '../../components/dashboard/StatCard'
import LessonTimeline from '../../components/dashboard/LessonTimeline'
import WeekBars from '../../components/dashboard/WeekBars'
import QuickActions from '../../components/dashboard/QuickActions'
import { heroActionClass, heroPrimaryActionClass } from '../../components/dashboard/styles'
import TelegramBanner from '../../components/TelegramBanner'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { buttonClass } from '../../components/ui/buttonStyles'
import Card, { SectionHeader } from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonRows } from '../../components/ui/Skeleton'

export default function TeacherOverviewPage() {
  const { user } = useAuth()
  const currentTime = useNow()
  const now = useMemo(() => tashkentWallTime(currentTime), [currentTime])
  const weekStart = toDateKey(startOfWeek(now))
  const todayKey = toDateKey(now)
  const today = weekdayNumber(now)

  const { data: fetched, isLoading, error, refresh } = useLessons(true, { weekStart })
  const { data: catalogSubjects } = useSubjects(true)
  const lessons = useMemo(() => fetched.filter((lesson) => lesson.weekStart === weekStart), [fetched, weekStart])
  const { data: statuses } = useAttendanceStatuses(todayKey)
  const takenIds = useMemo(() => new Set(statuses.map(({ lessonId }) => lessonId)), [statuses])

  const todayLessons = useMemo(() => lessonsOfDay(lessons, today), [lessons, today])
  const upcoming = useMemo(() => findUpcomingLesson(lessons, now), [lessons, now])
  const counts = useMemo(() => countByDay(lessons), [lessons])
  const groupCount = new Set(lessons.flatMap((lesson) => lesson.groups.map((group) => group.id))).size
  const assignedSubjects = useMemo(() => catalogSubjects.filter((subject) => (user?.subjectIds || []).includes(subject.id)), [catalogSubjects, user?.subjectIds])
  const subjectCount = assignedSubjects.length
  const takenToday = todayLessons.filter((lesson) => takenIds.has(lesson.id)).length
  const firstLoad = isLoading && !fetched.length

  if (!user) return null

  const subtitle = todayLessons.length
    ? `Bugun sizda ${todayLessons.length} ta dars bor. ${takenToday ? `${takenToday} tasi uchun davomat olingan.` : 'Davomatni dars vaqtida olishni unutmang.'}`
    : 'Bugun darslaringiz yo‘q. Haftalik jadval va band vaqtlaringizni ko‘rib chiqishingiz mumkin.'

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-4 px-3 pb-5 sm:px-4 lg:px-5 lg:pb-6">
      <DashboardHero
        name={user.name}
        now={now}
        subtitle={subtitle}
        badge={<span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">O‘qituvchi</span>}
        actions={
          <>
            <Link to="/teacher/schedule" className={heroPrimaryActionClass}>
              <CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />
              Haftalik jadval
            </Link>
            <Link to="/teacher/availability" className={heroActionClass}>
              <EventBusyRoundedIcon sx={{ fontSize: 18 }} />
              Band vaqtlarim
            </Link>
          </>
        }
        aside={<NextLessonCard upcoming={upcoming} loading={firstLoad} />}
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
        <StatCard icon={<EventNoteRoundedIcon />} label="Shu haftada" value={lessons.length} hint="Jami darslar" tone="sky" to="/teacher/schedule" loading={firstLoad} delay={60} />
        <StatCard icon={<GroupsRoundedIcon />} label="Guruhlar" value={groupCount} hint={`${subjectCount} ta fan`} tone="indigo" loading={firstLoad} delay={120} />
        <StatCard
          icon={<FactCheckRoundedIcon />}
          label="Bugungi davomat"
          value={todayLessons.length ? `${takenToday}/${todayLessons.length}` : '—'}
          hint={todayLessons.length && takenToday === todayLessons.length ? 'Hammasi olingan' : 'Olingan / jami'}
          tone="emerald"
          loading={firstLoad}
          delay={180}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-6">
        <Card className="p-3 sm:p-4">
          <SectionHeader
            icon={<TodayRoundedIcon sx={{ fontSize: 20 }} />}
            title="Bugungi darslar"
            description="Bugungi darslar uchun davomatni shu yerdan oling."
            action={<Link to="/teacher/schedule" className={buttonClass({ variant: 'ghost', size: 'sm' })}>Barchasi <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} /></Link>}
          />
          <div className="mt-5">
            {firstLoad ? (
              <SkeletonRows rows={3} />
            ) : todayLessons.length ? (
              <LessonTimeline
                lessons={todayLessons}
                now={now}
                renderAction={(lesson, status) => {
                  if (takenIds.has(lesson.id)) {
                    return (
                      <Link
                        to={`/teacher/attendance/${lesson.id}?date=${todayKey}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
                      >
                        <CheckCircleRoundedIcon sx={{ fontSize: 16 }} />
                        Davomat olingan — ko‘rish
                      </Link>
                    )
                  }
                  return (
                    <Link
                      to={`/teacher/attendance/${lesson.id}?date=${todayKey}`}
                      className={buttonClass({ variant: status === 'live' ? 'success' : 'soft', size: 'sm' })}
                    >
                      <FactCheckRoundedIcon sx={{ fontSize: 16 }} />
                      Davomat olish
                    </Link>
                  )
                }}
              />
            ) : (
              <EmptyState
                icon={<TodayRoundedIcon />}
                title="Bugun darslar yo‘q"
                description="Haftalik jadvalda keyingi darslaringizni ko‘rishingiz mumkin."
                action={<Link to="/teacher/schedule" className={buttonClass({ variant: 'secondary', size: 'sm' })}>Jadvalni ochish</Link>}
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
            <div className="mt-5">
              <WeekBars counts={counts} today={today} height={120} />
            </div>
          </Card>

          <Card className="p-3 sm:p-4">
            <SectionHeader icon={<BoltRoundedIcon sx={{ fontSize: 20 }} />} title="Tezkor amallar" />
            <div className="mt-3">
              <QuickActions
                items={[
                  { to: '/teacher/schedule', icon: <CalendarMonthRoundedIcon sx={{ fontSize: 20 }} />, title: 'Dars jadvali', text: 'Haftalik darslar va davomat', tone: 'brand' },
                  { to: '/teacher/availability', icon: <EventBusyRoundedIcon sx={{ fontSize: 20 }} />, title: 'Band vaqtlarim', text: 'Dars qo‘yilmasin degan vaqtlar', tone: 'amber' },
                  { to: '/teacher/profile', icon: <AccountCircleRoundedIcon sx={{ fontSize: 20 }} />, title: 'Profil va sozlamalar', text: 'Parol, Telegram ulanishi', tone: 'sky' },
                ]}
              />
            </div>
          </Card>

          {subjectCount > 0 && (
            <Card className="p-3 sm:p-4">
              <SectionHeader icon={<MenuBookRoundedIcon sx={{ fontSize: 20 }} />} title="Fanlarim" description="Hisobingizga biriktirilgan fanlar" />
              <ul className="mt-4 flex flex-wrap gap-2">
                {assignedSubjects.map((subject) => (
                  <li
                    key={subject.id}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-surface px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: subject.color }} />
                    {subject.name}
                    <span className="text-slate-400">{lessons.filter((lesson) => lesson.subject.id === subject.id).length} dars</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
