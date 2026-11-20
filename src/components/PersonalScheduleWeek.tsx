import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded'
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import PlayCircleRoundedIcon from '@mui/icons-material/PlayCircleRounded'
import TelegramIcon from '@mui/icons-material/Telegram'
import { useLessons } from '../hooks/useLessons'
import { useAttendanceStatuses } from '../hooks/useAttendanceStatuses'
import useAuth from '../hooks/useAuth'
import useTelegram from '../hooks/useTelegram'
import { addDays, formatDate, formatWeekRange, startOfWeek, toDateKey, tashkentWallTime } from '../utils/date'
import { PERIODS, periodRange } from '../utils/periods'
import { lessonGroupNames, lessonTypeLabel } from '../utils/lessons'
import type { Lesson, Role } from '../types'
import PageHeading from './PageHeading'
import Badge from './ui/Badge'
import Button from './ui/Button'
import { buttonClass } from './ui/buttonStyles'
import Card from './ui/Card'
import EmptyState from './ui/EmptyState'
import { Skeleton } from './ui/Skeleton'

type ScheduleRole = Extract<Role, 'teacher' | 'student'>
type Status = 'live' | 'done' | 'upcoming' | 'idle'

const DAYS = [
  { value: 1, label: 'Dushanba', short: 'Du' },
  { value: 2, label: 'Seshanba', short: 'Se' },
  { value: 3, label: 'Chorshanba', short: 'Ch' },
  { value: 4, label: 'Payshanba', short: 'Pa' },
  { value: 5, label: 'Juma', short: 'Ju' },
  { value: 6, label: 'Shanba', short: 'Sh' },
]

const FALLBACK_COLOR = '#6a3ce0'

function normalizeColor(color?: string) {
  return color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : FALLBACK_COLOR
}

function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function nowMinutes(d: Date) {
  return d.getHours() * 60 + d.getMinutes()
}

function lessonStatus(lesson: Lesson, isToday: boolean, now: number): Status {
  if (!isToday) return 'idle'
  const slot = PERIODS[lesson.period - 1]
  if (!slot) return 'idle'
  if (now >= toMinutes(slot.end)) return 'done'
  if (now >= toMinutes(slot.start)) return 'live'
  return 'upcoming'
}

function findNextLesson(lessons: Lesson[], from: Date) {
  for (let offset = 1; offset <= 7; offset += 1) {
    const date = new Date(from)
    date.setDate(from.getDate() + offset)
    const dayValue = ((date.getDay() + 6) % 7) + 1
    const day = DAYS.find((item) => item.value === dayValue)
    if (!day) continue
    const count = lessons.filter((lesson) => lesson.dayOfWeek === dayValue).length
    if (count) return { date, dayLabel: day.label, count }
  }
  return null
}

function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

export default function PersonalScheduleWeek({ role }: { role: ScheduleRole }) {
  const { user } = useAuth()
  const now = useNow()
  const today = tashkentWallTime(now)
  const [monday, setMonday] = useState(() => startOfWeek(tashkentWallTime()))
  const todayOfWeek = ((today.getDay() + 6) % 7) + 1
  const [selectedDay, setSelectedDay] = useState(todayOfWeek <= 6 ? todayOfWeek : 1)

  const weekStart = toDateKey(monday)
  const { data: fetchedLessons, isLoading, error, refresh } = useLessons(true, { weekStart })
  const lessons = useMemo(
    () => fetchedLessons.filter((lesson) => lesson.weekStart === weekStart),
    [fetchedLessons, weekStart],
  )

  const isCurrentWeek = monday.getTime() === startOfWeek(today).getTime()
  const todayDate = toDateKey(today)
  const { data: attendanceStatuses } = useAttendanceStatuses(todayDate, role === 'teacher')
  const takenIds = useMemo(
    () => new Set(attendanceStatuses.map(({ lessonId }) => lessonId)),
    [attendanceStatuses],
  )

  const byDay = useMemo(() => {
    const map = new Map<number, Lesson[]>()
    DAYS.forEach((d) => map.set(d.value, []))
    lessons.forEach((l) => map.get(l.dayOfWeek)?.push(l))
    map.forEach((list) => list.sort((a, b) => a.period - b.period))
    return map
  }, [lessons])

  const totalLessons = lessons.length
  const groupCount = new Set(lessons.flatMap((l) => l.groups.map((group) => group.id))).size
  const periods = lessons.map((l) => l.period)
  const timeRange = periods.length
    ? `${PERIODS[Math.min(...periods) - 1].start}–${PERIODS[Math.max(...periods) - 1].end}`
    : '—'

  const todayLessons = isCurrentWeek ? byDay.get(todayOfWeek) ?? [] : []
  const nowMin = nowMinutes(today)
  const live = todayLessons.find((l) => lessonStatus(l, true, nowMin) === 'live')
  const upcoming = todayLessons.find((l) => lessonStatus(l, true, nowMin) === 'upcoming')
  const firstLoad = isLoading && lessons.length === 0

  function changeWeek(amount: number) {
    setMonday((current) => {
      const next = new Date(current)
      next.setDate(next.getDate() + amount * 7)
      return next
    })
  }

  function goToday() {
    setMonday(startOfWeek(tashkentWallTime()))
    setSelectedDay(todayOfWeek <= 6 ? todayOfWeek : 1)
  }

  if (!user) return null

  const statLine = [
    `${totalLessons} ta dars`,
    role === 'teacher' ? `${groupCount} ta guruh` : user.group?.name || 'Guruh',
    timeRange,
  ]

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 pb-6 sm:px-6 lg:px-10 lg:pb-9">
      <PageHeading
        eyebrow={role === 'teacher' ? 'O‘qituvchi kabineti' : 'Talaba kabineti'}
        title="Dars jadvali"
        description={
          role === 'teacher'
            ? 'Haftalik darslaringiz. Bugungi darslar uchun davomatni shu yerdan olasiz.'
            : `${user.group?.name || 'Guruh'} guruhining haftalik dars jadvali.`
        }
        icon={role === 'teacher' ? <EventNoteRoundedIcon /> : <CalendarTodayRoundedIcon />}
        action={
          role === 'student' ? (
            <Link to="/student/attendance" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              <FactCheckOutlinedIcon sx={{ fontSize: 16 }} />
              Davomat natijalari
            </Link>
          ) : undefined
        }
      />

      {error && (
        <div
          role="alert"
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          <span className="flex items-center gap-2">
            <ErrorOutlineRoundedIcon sx={{ fontSize: 18 }} />
            {error}
          </span>
          <Button variant="dangerSoft" size="sm" startIcon={<RefreshRoundedIcon sx={{ fontSize: 16 }} />} onClick={() => void refresh()}>
            Qayta urinish
          </Button>
        </div>
      )}

      {/* Week toolbar: range + summary + navigation in a single row */}
      <Card className="mb-5 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="min-w-0 px-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-bold text-slate-900 sm:text-lg">
              {formatWeekRange(monday, addDays(monday, 5))}
            </h2>
            {isCurrentWeek && <Badge tone="success" dot>Joriy hafta</Badge>}
            {isLoading && !firstLoad && <span className="text-xs font-semibold text-brand-600">yangilanmoqda…</span>}
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500">{statLine.join('  ·  ')}</p>
        </div>

        <div className="flex items-center gap-1.5">
          <IconNavButton label="Oldingi hafta" onClick={() => changeWeek(-1)}>
            <ChevronLeftRoundedIcon sx={{ fontSize: 22 }} />
          </IconNavButton>
          <button
            type="button"
            disabled={isCurrentWeek}
            onClick={goToday}
            className="h-11 flex-1 rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 disabled:cursor-default disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 sm:flex-none"
          >
            Bugun
          </button>
          <IconNavButton label="Keyingi hafta" onClick={() => changeWeek(1)}>
            <ChevronRightRoundedIcon sx={{ fontSize: 22 }} />
          </IconNavButton>
        </div>
      </Card>

      {firstLoad ? (
        <ScheduleSkeleton />
      ) : totalLessons === 0 && error ? (
        <Card>
          <EmptyState
            icon={<EventBusyRoundedIcon />}
            title="Jadvalni yuklab bo‘lmadi"
            description="Internet aloqasini tekshirib, qayta urinib ko‘ring."
            action={
              <Button variant="secondary" startIcon={<RefreshRoundedIcon sx={{ fontSize: 16 }} />} onClick={() => void refresh()}>
                Yangilash
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          {isCurrentWeek && totalLessons > 0 && (
            <FocusCard
              role={role}
              live={live}
              upcoming={upcoming}
              todayCount={todayLessons.length}
              now={nowMin}
              attendanceTaken={(l) => takenIds.has(l.id)}
              todayDate={todayDate}
              nextDay={todayLessons.length === 0 || (!live && !upcoming) ? findNextLesson(lessons, today) : null}
            />
          )}

          {/* Day tabs: visible below lg, pick one day at a time */}
          <div
            role="tablist"
            aria-label="Hafta kunlari"
            className="mb-4 grid grid-cols-6 gap-1.5 rounded-2xl bg-slate-100/80 p-1.5 lg:hidden"
          >
            {DAYS.map((day) => {
              const count = byDay.get(day.value)?.length ?? 0
              const active = selectedDay === day.value
              const isToday = isCurrentWeek && day.value === todayOfWeek
              return (
                <button
                  key={day.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedDay(day.value)}
                  className={`relative flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${
                    active ? 'bg-surface font-bold text-brand-700 shadow-sm' : 'font-medium text-slate-500 hover:bg-surface/60'
                  }`}
                >
                  <span>{day.short}</span>
                  <span className={`text-base font-bold leading-none ${isToday && !active ? 'text-brand-600' : ''}`}>
                    {addDays(monday, day.value - 1).getDate()}
                  </span>
                  <span className="flex h-1.5 items-center gap-0.5" aria-label={`${count} ta dars`}>
                    {Array.from({ length: Math.min(count, 4) }, (_, i) => (
                      <i key={i} className={`block size-1 rounded-full ${active ? 'bg-brand-500' : 'bg-slate-300'}`} />
                    ))}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Desktop: 6-column week board. Mobile/tablet: only the selected day */}
          <div className="grid gap-x-4 gap-y-2.5 lg:grid-cols-3 lg:[grid-template-rows:repeat(9,auto)] xl:grid-cols-6 xl:gap-x-3">
            {DAYS.map((day) => {
              const list = byDay.get(day.value) ?? []
              const isToday = isCurrentWeek && day.value === todayOfWeek
              const date = addDays(monday, day.value - 1)
              return (
                <section
                  key={day.value}
                  role="tabpanel"
                  aria-label={day.label}
                  aria-current={isToday ? 'date' : undefined}
                  className={`${selectedDay === day.value ? 'block' : 'hidden'} min-w-0 lg:row-span-9 lg:grid lg:grid-rows-subgrid`}
                >
                  <header
                    className={`mb-2.5 flex items-center justify-between rounded-xl px-3 py-2.5 ${
                      isToday ? 'theme-fixed bg-brand-600 text-white shadow-glow' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div>
                      <h3 className="text-sm font-bold">{day.label}</h3>
                      <p className={`text-xs ${isToday ? 'text-brand-100' : 'text-slate-500'}`}>
                        {formatDate(date, { month: 'long' })}
                      </p>
                    </div>
                    <span
                      className={`grid h-7 min-w-7 place-items-center rounded-lg px-2 text-xs font-bold ${
                        isToday ? 'bg-white/20' : 'bg-surface text-slate-600'
                      }`}
                    >
                      {list.length}
                    </span>
                  </header>

                  <ol className="grid grid-cols-1 gap-2.5 lg:contents">
                    {PERIODS.map((period) => {
                      const slotLessons = list.filter((lesson) => lesson.period === period.number)
                      return (
                        <li key={period.number} value={period.number} className="grid gap-2.5">
                          {slotLessons.length ? (
                            slotLessons.map((lesson) => {
                              const status = lessonStatus(lesson, isToday, nowMin)
                              return (
                                <LessonCard
                                  key={lesson.id}
                                  lesson={lesson}
                                  role={role}
                                  status={status}
                                  showAttendance={role === 'teacher' && isToday}
                                  attendanceTaken={takenIds.has(lesson.id)}
                                  todayDate={todayDate}
                                />
                              )
                            })
                          ) : (
                            <article className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3.5 pl-4">
                              <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                                <span className="font-bold">{period.number}-para</span>
                                <span className="inline-flex items-center gap-1 font-medium">
                                  <AccessTimeRoundedIcon sx={{ fontSize: 14 }} />
                                  {periodRange(period.number)}
                                </span>
                              </div>
                              <div className="flex items-center justify-center gap-2 py-3 text-slate-400">
                                <EventBusyRoundedIcon sx={{ fontSize: 20 }} />
                                <p className="text-sm font-semibold">Dars yo‘q</p>
                              </div>
                            </article>
                          )}
                        </li>
                      )
                    })}
                  </ol>
                </section>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function IconNavButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-xl border border-slate-200 bg-surface text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
    >
      {children}
    </button>
  )
}

function FocusCard({
  role,
  live,
  upcoming,
  todayCount,
  now,
  attendanceTaken,
  todayDate,
  nextDay,
}: {
  role: ScheduleRole
  live?: Lesson
  upcoming?: Lesson
  todayCount: number
  now: number
  attendanceTaken: (lesson: Lesson) => boolean
  todayDate: string
  nextDay: { date: Date; dayLabel: string; count: number } | null
}) {
  const { status: telegramStatus } = useTelegram()
  const lesson = live ?? upcoming
  const color = normalizeColor(lesson?.subject.color)

  if (!lesson) {
    const title = todayCount ? 'Bugungi darslar tugadi' : 'Bugun dars yo‘q'
    const text = nextDay
      ? `Keyingi dars: ${nextDay.dayLabel}, ${formatDate(nextDay.date, { month: 'long' })} (${nextDay.count} ta).`
      : 'Bu haftada boshqa dars qolmadi.'
    return (
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-surface p-4 shadow-card">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500">
          <EventBusyRoundedIcon />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <p className="mt-0.5 text-xs text-slate-500">{text}</p>
        </div>
      </div>
    )
  }

  const slot = PERIODS[lesson.period - 1]
  const minutes = live ? toMinutes(slot.end) - now : toMinutes(slot.start) - now
  const when = live ? `${minutes} daqiqa qoldi` : minutes >= 60 ? `${Math.floor(minutes / 60)} soat ${minutes % 60} daqiqadan keyin` : `${minutes} daqiqadan keyin`

  return (
    <div
      className="theme-fixed mb-5 flex flex-col gap-4 rounded-2xl p-4 text-white shadow-glow sm:flex-row sm:items-center sm:justify-between sm:p-5"
      style={{ background: `linear-gradient(135deg, ${color}, #3b1fa8)` } as CSSProperties}
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/20">
          {live ? <PlayCircleRoundedIcon /> : <AccessTimeRoundedIcon />}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white/80">
            {live ? 'Hozir davom etmoqda' : 'Keyingi dars'} · {when}
          </p>
          <p className="mt-0.5 truncate text-lg font-bold">{lesson.subject.name}</p>
          <p className="mt-0.5 truncate text-xs text-white/80">
            {periodRange(lesson.period)} · {role === 'teacher' ? lessonGroupNames(lesson) : lesson.teacher.name} ·{' '}
            {lesson.room || 'Xona belgilanmagan'}
          </p>
          {role === 'teacher' && !live && telegramStatus?.lessonReminder?.enabled && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white/90">
              <TelegramIcon sx={{ fontSize: 14 }} />
              Telegram eslatmasi · {telegramStatus.lessonReminder.minutesBefore} daqiqa oldin
            </span>
          )}
        </div>
      </div>
      {role === 'teacher' &&
        (attendanceTaken(lesson) ? (
          <span className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-bold">
            <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />
            Davomat olingan
          </span>
        ) : (
          <Link
            to={`/teacher/attendance/${lesson.id}?date=${todayDate}`}
            className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            Davomat olish
          </Link>
        ))}
    </div>
  )
}

function LessonCard({
  lesson,
  role,
  status,
  showAttendance,
  attendanceTaken,
  todayDate,
}: {
  lesson: Lesson
  role: ScheduleRole
  status: Status
  showAttendance: boolean
  attendanceTaken: boolean
  todayDate: string
}) {
  const color = normalizeColor(lesson.subject.color)
  const done = status === 'done'
  const live = status === 'live'

  return (
    <article
      className={`relative h-full overflow-hidden rounded-xl border bg-surface p-3.5 pl-4 transition ${
        live ? 'border-brand-300 ring-2 ring-brand-100' : 'border-slate-200/80 hover:border-brand-200 hover:shadow-card-hover'
      } ${done ? 'opacity-60' : ''}`}
    >
      <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: color } as CSSProperties} aria-hidden="true" />

      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-bold" style={{ color } as CSSProperties}>
          {lesson.period}-para
        </span>
        <span className="inline-flex items-center gap-1 font-medium text-slate-500">
          <AccessTimeRoundedIcon sx={{ fontSize: 14 }} />
          {periodRange(lesson.period)}
        </span>
      </div>

      <h4 className="mt-1.5 text-[15px] font-bold leading-snug text-slate-900">{lesson.subject.name}</h4>
      <Badge tone="neutral" className="mt-1.5">{lessonTypeLabel(lesson.type)}</Badge>

      <div className="mt-2 grid gap-1 text-xs text-slate-500">
        {role === 'teacher' ? (
          <MetaRow icon={<GroupsRoundedIcon sx={{ fontSize: 15 }} />}>{lessonGroupNames(lesson)}</MetaRow>
        ) : (
          <MetaRow icon={<PersonRoundedIcon sx={{ fontSize: 15 }} />}>{lesson.teacher.name}</MetaRow>
        )}
        <MetaRow icon={<MeetingRoomRoundedIcon sx={{ fontSize: 15 }} />}>{lesson.room || 'Xona belgilanmagan'}</MetaRow>
      </div>

      {(live || done) && !showAttendance && (
        <Badge tone={live ? 'brand' : 'neutral'} dot className="mt-2.5">
          {live ? 'Davom etmoqda' : 'Tugagan'}
        </Badge>
      )}

      {showAttendance &&
        (attendanceTaken ? (
          <span className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
            <CheckCircleRoundedIcon sx={{ fontSize: 15 }} />
            Davomat olingan
          </span>
        ) : (
          <Link
            className={`${buttonClass({ size: 'sm', variant: done ? 'secondary' : undefined })} mt-3 w-full`}
            to={`/teacher/attendance/${lesson.id}?date=${todayDate}`}
          >
            Davomat olish
          </Link>
        ))}
    </article>
  )
}

function MetaRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-slate-400">{icon}</span>
      <span className="truncate">{children}</span>
    </span>
  )
}

function ScheduleSkeleton() {
  return (
    <div aria-busy="true" aria-label="Dars jadvali yuklanmoqda">
      <Skeleton className="mb-5 h-24 w-full rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-6 xl:gap-3">
        {Array.from({ length: 6 }, (_, col) => (
          <div key={col} className={col > 0 ? 'hidden lg:block' : ''}>
            <Skeleton className="mb-2.5 h-14 w-full rounded-xl" />
            <div className="grid gap-2.5">
              {PERIODS.map((period) => (
                <Skeleton key={period.number} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}