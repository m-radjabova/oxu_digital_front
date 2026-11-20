import FilterSelect from './ui/FilterSelect'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import MetricCard from './ui/MetricCard'
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import ClassRoundedIcon from '@mui/icons-material/ClassRounded'
import FilterAltOffRoundedIcon from '@mui/icons-material/FilterAltOffRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import { useGroups } from '../hooks/useGroups'
import { useAcademicStructure } from '../hooks/useAcademicStructure'
import { useLessons } from '../hooks/useLessons'
import { useTeacherAvailability } from '../hooks/useTeacherAvailability'
import { useSubjects } from '../hooks/useSubjects'
import { usePaginatedUsers } from '../hooks/usePaginatedUsers'
import useToast from '../hooks/useToast'
import { addDays, formatDate, formatWeekRange, getTodayDateKey, startOfWeek, toDateKey } from '../utils/date'
import { PERIODS } from '../utils/periods'
import { lessonGroupNames, lessonTypeLabel, lessonTypeShort } from '../utils/lessons'
import type { Lesson, TeacherAvailability, User } from '../types'
import type { LessonInput } from '../hooks/useLessons'
import LessonDialog from './LessonDialog'
import PageHeading from './PageHeading'
import Pagination from './Pagination'
import Button from './ui/Button'
import Badge from './ui/Badge'
import Card from './ui/Card'
import EmptyState from './ui/EmptyState'
import { Skeleton } from './ui/Skeleton'

const DAYS = [
  { value: 1, label: 'Dushanba', short: 'Du' }, { value: 2, label: 'Seshanba', short: 'Se' },
  { value: 3, label: 'Chorshanba', short: 'Ch' }, { value: 4, label: 'Payshanba', short: 'Pa' },
  { value: 5, label: 'Juma', short: 'Ju' }, { value: 6, label: 'Shanba', short: 'Sh' },
]

function getDayDate(monday: Date, day: number) {
  return addDays(monday, day - 1)
}

function formatWeek(monday: Date) {
  return formatWeekRange(monday, getDayDate(monday, 6))
}

function formatDayDate(date: Date) {
  return formatDate(date, { month: 'short' })
}

const FALLBACK_COLOR = '#6a3ce0'

function normalizeColor(color?: string) {
  return color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : FALLBACK_COLOR
}

function tint(color: string | undefined, alpha: string) {
  return `${normalizeColor(color)}${alpha}`
}

export default function AdminScheduleGrid() {
  const toast = useToast()
  const { data: groups } = useGroups()
  const { faculties, departments, directions } = useAcademicStructure()
  const { data: subjects } = useSubjects()
  const [teacherPage, setTeacherPage] = useState(1)
  const [facultyFilter, setFacultyFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [directionFilter, setDirectionFilter] = useState('')
  const {
    data: teachersPage,
    isLoading: teachersLoading,
    error: teachersError,
    refresh: refreshTeachers,
  } = usePaginatedUsers('teacher', teacherPage, {
    facultyId: facultyFilter,
    departmentId: departmentFilter,
    directionId: directionFilter,
  })
  const teachers = teachersPage.items
  const teacherIds = useMemo(() => teachers.map(({ id }) => id).join(','), [teachers])
  const [monday, setMonday] = useState(() => startOfWeek(new Date()))
  const weekStart = toDateKey(monday)
  const {
    data: fetchedLessons,
    isLoading: lessonsLoading,
    error: lessonsError,
    refresh: refreshLessons,
    saveLesson,
    deleteLesson,
  } = useLessons(teachers.length > 0, {
    weekStart,
    facultyId: facultyFilter,
    departmentId: departmentFilter,
    directionId: directionFilter,
  })
  const {
    data: teacherAvailability,
    isLoading: availabilityLoading,
    error: availabilityError,
    refresh: refreshAvailability,
  } = useTeacherAvailability(teachers.length > 0, { teacherIds, weekStart })
  const lessons = useMemo(
    () => fetchedLessons.filter((lesson) => lesson.weekStart === weekStart),
    [fetchedLessons, weekStart],
  )
  const [teacherFilter, setTeacherFilter] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [dialog, setDialog] = useState<{
    teacher: User
    day: number
    period: number
    lesson?: Lesson
    isPastOrToday?: boolean
  } | null>(null)
  const [isMutating, setIsMutating] = useState(false)

  const todayDateKey = getTodayDateKey()
  const today = new Date(`${todayDateKey}T00:00:00`)
  const isCurrentWeek = startOfWeek(today).getTime() === monday.getTime()
  const todayDay = ((today.getDay() + 6) % 7) + 1

  const visibleTeachers = useMemo(
    () => teachers.filter((teacher) => !teacherFilter || teacher.id === teacherFilter),
    [teacherFilter, teachers],
  )
  const visibleLessons = useMemo(
    () => lessons.filter((lesson) => !groupFilter || lesson.groups.some((group) => group.id === groupFilter)),
    [groupFilter, lessons],
  )
  const allLessonsBySlot = useMemo(() => {
    const index = new Map<string, Lesson>()
    for (const lesson of lessons) {
      index.set(`${lesson.teacher.id}:${lesson.dayOfWeek}:${lesson.period}`, lesson)
    }
    return index
  }, [lessons])
  const roomLessonsBySlot = useMemo(() => {
    const index = new Map<string, Lesson[]>()
    for (const lesson of lessons) {
      if (!lesson.room.trim()) continue
      const key = `${lesson.dayOfWeek}:${lesson.period}`
      index.set(key, [...(index.get(key) || []), lesson])
    }
    return index
  }, [lessons])
  const allBusySlotsBySlot = useMemo(() => {
    const index = new Map<string, TeacherAvailability>()
    for (const slot of teacherAvailability) {
      index.set(`${slot.teacher.id}:${slot.dayOfWeek}:${slot.period}`, slot)
    }
    return index
  }, [teacherAvailability])
  const groupCount = useMemo(
    () => new Set(lessons.flatMap((lesson) => lesson.groups.map((group) => group.id))).size,
    [lessons],
  )
  const filteredGroups = useMemo(
    () => [...new Map(lessons.flatMap((lesson) => lesson.groups.map((group) => [group.id, group] as const))).values()],
    [lessons],
  )
  const visibleDepartments = useMemo(
    () => departments.filter((department) => !facultyFilter || department.faculty.id === facultyFilter),
    [departments, facultyFilter],
  )
  const visibleDirections = useMemo(
    () => directions.filter((direction) =>
      (!facultyFilter || direction.department.faculty.id === facultyFilter) &&
      (!departmentFilter || direction.department.id === departmentFilter),
    ),
    [departmentFilter, directions, facultyFilter],
  )
  const visibleGroupOptions = useMemo(
    () => groups.filter((group) =>
      !facultyFilter && !departmentFilter && !directionFilter
      || Boolean(group.direction && visibleDirections.some((direction) => direction.id === group.direction?.id)),
    ),
    [departmentFilter, directionFilter, facultyFilter, groups, visibleDirections],
  )

  const hasFilters = Boolean(facultyFilter || departmentFilter || directionFilter || teacherFilter || groupFilter)
  const firstLoad = teachersLoading && teachers.length === 0
  const loadError = teachersError || lessonsError || availabilityError

  function getLesson(teacherId: string, day: number, period: number) {
    return allLessonsBySlot.get(`${teacherId}:${day}:${period}`)
  }

  function getRoomLessons(day: number, period: number) {
    return roomLessonsBySlot.get(`${day}:${period}`) || []
  }

  function getBusySlot(teacherId: string, day: number, period: number) {
    return allBusySlotsBySlot.get(`${teacherId}:${day}:${period}`)
  }

  // Guruh shu parada boshqa darsda bo‘lsa, modalda oldindan tanlanmaydi.
  function isGroupFreeAtSlot(groupId: string, day: number, period: number) {
    return !lessons.some((lesson) =>
      lesson.dayOfWeek === day
      && lesson.period === period
      && lesson.groups.some((group) => group.id === groupId),
    )
  }

  function moveWeek(amount: number) {
    setMonday((current) => {
      const next = new Date(current)
      next.setDate(next.getDate() + amount * 7)
      return next
    })
  }

  function changeTeacherPage(nextPage: number) {
    setTeacherFilter('')
    setTeacherPage(nextPage)
  }

  function changeFacultyFilter(value: string) {
    setFacultyFilter(value)
    setDepartmentFilter('')
    setDirectionFilter('')
    setTeacherFilter('')
    setGroupFilter('')
    setTeacherPage(1)
  }

  function changeDepartmentFilter(value: string) {
    setDepartmentFilter(value)
    setDirectionFilter('')
    setTeacherFilter('')
    setGroupFilter('')
    setTeacherPage(1)
  }

  function changeDirectionFilter(value: string) {
    setDirectionFilter(value)
    setTeacherFilter('')
    setGroupFilter('')
    setTeacherPage(1)
  }

  function clearFilters() {
    setFacultyFilter('')
    setDepartmentFilter('')
    setDirectionFilter('')
    setTeacherFilter('')
    setGroupFilter('')
    setTeacherPage(1)
  }

  async function handleSave(values: LessonInput, lesson?: Lesson) {
    setIsMutating(true)
    try {
      await saveLesson(values, lesson?.id)
      setDialog(null)
      toast.success(lesson ? 'Dars ma’lumotlari yangilandi.' : 'Yangi dars jadvalga qo‘shildi.', 'Saqlandi')
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Darsni saqlab bo‘lmadi.')
    } finally {
      setIsMutating(false)
    }
  }

  async function handleDelete(lesson: Lesson) {
    setIsMutating(true)
    try {
      await deleteLesson(lesson.id)
      setDialog(null)
      toast.success('Dars jadvaldan olib tashlandi.', 'O‘chirildi')
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Darsni o‘chirib bo‘lmadi.')
    } finally {
      setIsMutating(false)
    }
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[1800px] px-3 pb-5 sm:px-4 lg:px-5 lg:pb-6">
        <PageHeading
          eyebrow="Administrator kabineti"
          title="O‘qituvchilar dars jadvali"
          description="Fakultet, kafedra, yo‘nalish, hafta, guruh va o‘qituvchini tanlang — darslarni jadval katagidan boshqaring."
          icon={<EventNoteRoundedIcon />}
          action={
            <Badge tone={isCurrentWeek ? 'success' : 'neutral'} dot className="h-8 px-3 text-xs">
              {isCurrentWeek ? 'Joriy hafta' : 'Tanlangan hafta'}
            </Badge>
          }
        />

        {loadError && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <span className="flex items-center gap-2">
              <ErrorOutlineRoundedIcon sx={{ fontSize: 18 }} />
              {loadError}
            </span>
            <Button
              variant="dangerSoft"
              size="sm"
              onClick={() => {
                void refreshTeachers()
                void refreshLessons()
                void refreshAvailability()
              }}
            >
              Qayta urinish
            </Button>
          </div>
        )}

        <div className="mb-5 grid gap-4">
          <Card className="flex flex-col gap-4 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3"><span className="flex items-center gap-2 text-sm font-bold text-slate-800"><span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-700"><TuneRoundedIcon sx={{ fontSize: 18 }} /></span>Jadval filtrlari</span><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${hasFilters ? 'bg-brand-50 text-brand-700' : 'bg-slate-50 text-slate-500'}`}>{hasFilters ? `${[facultyFilter, departmentFilter, directionFilter, groupFilter, teacherFilter].filter(Boolean).length} ta faol filtr` : 'Barcha natijalar'}</span></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
              <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Fakultet
                <FilterSelect icon={<AccountBalanceRoundedIcon />}
                  className="h-11 min-w-0 rounded-xl border border-slate-200 bg-surface px-3 text-sm font-medium normal-case tracking-normal text-slate-700 shadow-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  value={facultyFilter}
                  onChange={(event) => changeFacultyFilter(event.target.value)}
                >
                  <option value="">Barcha fakultetlar</option>
                  {faculties.map((faculty) => <option value={faculty.id} key={faculty.id}>{faculty.name}</option>)}
                </FilterSelect>
              </label>
              <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Kafedra
                <FilterSelect icon={<AccountTreeRoundedIcon />}
                  className="h-11 min-w-0 rounded-xl border border-slate-200 bg-surface px-3 text-sm font-medium normal-case tracking-normal text-slate-700 shadow-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  value={departmentFilter}
                  onChange={(event) => changeDepartmentFilter(event.target.value)}
                  disabled={!visibleDepartments.length}
                >
                  <option value="">Barcha kafedralar</option>
                  {visibleDepartments.map((department) => <option value={department.id} key={department.id}>{department.name}</option>)}
                </FilterSelect>
              </label>
              <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Yo‘nalish
                <FilterSelect icon={<AccountTreeRoundedIcon />}
                  className="h-11 min-w-0 rounded-xl border border-slate-200 bg-surface px-3 text-sm font-medium normal-case tracking-normal text-slate-700 shadow-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  value={directionFilter}
                  onChange={(event) => changeDirectionFilter(event.target.value)}
                  disabled={!visibleDirections.length}
                >
                  <option value="">Barcha yo‘nalishlar</option>
                  {visibleDirections.map((direction) => <option value={direction.id} key={direction.id}>{direction.name}</option>)}
                </FilterSelect>
              </label>
              <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Guruh bo‘yicha filtr
                <FilterSelect icon={<GroupsRoundedIcon />}
                  className="h-11 min-w-0 rounded-xl border border-slate-200 bg-surface px-3 text-sm font-medium normal-case tracking-normal text-slate-700 shadow-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  value={groupFilter}
                  onChange={(event) => setGroupFilter(event.target.value)}
                >
                  <option value="">Barcha guruhlar</option>
                  {visibleGroupOptions.map((group) => (
                    <option value={group.id} key={group.id}>
                      {group.name}{group.isActive === false ? ' · nofaol' : ''}
                    </option>
                  ))}
                </FilterSelect>
              </label>
              <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                O‘qituvchi (joriy sahifa)
                <FilterSelect icon={<PersonRoundedIcon />}
                  className="h-11 min-w-0 rounded-xl border border-slate-200 bg-surface px-3 text-sm font-medium normal-case tracking-normal text-slate-700 shadow-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  value={teacherFilter}
                  onChange={(event) => setTeacherFilter(event.target.value)}
                >
                  <option value="">Barcha o‘qituvchilar</option>
                  {teachers.map((teacher) => <option value={teacher.id} key={teacher.id}>{teacher.name}</option>)}
                </FilterSelect>
              </label>
            </div>
            {hasFilters && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" startIcon={<FilterAltOffRoundedIcon sx={{ fontSize: 16 }} />} onClick={clearFilters}>
                  Filtrlarni tozalash
                </Button>
              </div>
            )}
          </Card>

          <Card className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-5 sm:py-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tanlangan hafta</p>
              <p className="truncate text-base font-bold text-slate-800 sm:text-lg">{formatWeek(monday)}</p>
              <p className="text-[11px] text-slate-500">Dushanba — Shanba</p>
            </div>
            <div className="flex items-center gap-2">
              <button
              type="button"
              className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-surface text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              onClick={() => moveWeek(-1)}
              aria-label="Oldingi hafta"
            >
              <ChevronLeftRoundedIcon sx={{ fontSize: 20 }} />
              </button>
              <button
              type="button"
              className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-surface text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              onClick={() => moveWeek(1)}
              aria-label="Keyingi hafta"
            >
              <ChevronRightRoundedIcon sx={{ fontSize: 20 }} />
              </button>
              <Button variant="soft" size="sm" onClick={() => setMonday(startOfWeek(new Date()))}>
                Bugun
              </Button>
            </div>
          </Card>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={<PeopleAltRoundedIcon sx={{ fontSize: 18 }} />} label="O‘qituvchilar" value={teachersPage.total} hint="Jami hisoblar" tone="brand" />
          <StatCard icon={<ClassRoundedIcon sx={{ fontSize: 18 }} />} label="Darslar" value={visibleLessons.length} hint={groupFilter ? 'Tanlangan guruh bo‘yicha' : 'Tanlangan haftada'} tone="info" />
          <StatCard icon={<GroupsRoundedIcon sx={{ fontSize: 18 }} />} label="Guruhlar" value={groupCount} hint="Dars biriktirilgan" tone="warning" />
          <div className="theme-fixed col-span-2 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 p-4 text-white shadow-glow lg:col-span-1">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15">
              <CalendarMonthRoundedIcon sx={{ fontSize: 20 }} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-brand-100">Hafta oralig‘i</p>
              <p className="truncate text-sm font-bold">{formatWeek(monday)}</p>
              <p className="mt-0.5 text-[11px] text-brand-100/80">Dushanba — Shanba</p>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">Haftalik jadval</h2>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                {visibleTeachers.length} ta o‘qituvchi / {teachersPage.total} jami · {visibleLessons.length} ta dars
                {lessonsLoading && teachers.length > 0 && <span className="ml-2 text-brand-600">yangilanmoqda…</span>}
                {!lessonsLoading && fetchedLessons.length === 0 && (
                  <span className="ml-2 font-semibold text-amber-600">· bu haftada dars yo‘q, katakni bosib qo‘shing</span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {subjects.slice(0, 5).map((subject) => (
                <span key={subject.id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                  <span className="size-2 rounded-full" style={{ backgroundColor: normalizeColor(subject.color) }} />
                  {subject.name}
                </span>
              ))}
              {subjects.length > 5 && (
                <span className="text-[11px] font-semibold text-slate-400">+{subjects.length - 5}</span>
              )}
            </div>
          </div>

          {firstLoad ? (
            <TableSkeleton groups={filteredGroups.length} />
          ) : teachers.length === 0 ? (
            <EmptyState
              icon={<PeopleAltRoundedIcon />}
              title="Hali o‘qituvchi hisobi yo‘q"
              description="Jadvalni shakllantirish uchun avval “Hisoblar” bo‘limidan o‘qituvchi yarating."
              action={<Link to="/admin/accounts" className="inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-700 dark:hover:bg-brand-400">Hisob yaratish</Link>}
            />
          ) : visibleTeachers.length === 0 ? (
            <EmptyState
              icon={<PeopleAltRoundedIcon />}
              title="Filtrga mos o‘qituvchi topilmadi"
              description="Boshqa o‘qituvchini tanlang yoki filtrlarni tozalang."
              action={<Button variant="secondary" onClick={clearFilters}>Filtrlarni tozalash</Button>}
            />
          ) : (
            <div className="overflow-auto">
              <table className="w-full min-w-[2310px] border-collapse text-left">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-50 text-slate-700">
                    <th rowSpan={2} className="sticky left-0 z-20 w-64 min-w-64 border-b border-r border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      O‘qituvchi F.I.Sh
                    </th>
                    {DAYS.map((day) => {
                      const date = getDayDate(monday, day.value)
                      const dateKey = toDateKey(date)
                      const isToday = isCurrentWeek && day.value === todayDay
                      const isPast = dateKey < todayDateKey
                      return (
                        <th
                          colSpan={PERIODS.length}
                          key={day.value}
                          className={`border-b border-r border-slate-200 px-2 py-2 text-center last:border-r-0 ${
                            isToday ? 'bg-brand-50' : isPast ? 'bg-slate-100/70' : ''
                          }`}
                        >
                          <span className={`inline-flex items-center justify-center gap-1.5 text-xs font-bold ${
                            isToday ? 'text-brand-700' : isPast ? 'text-slate-400' : 'text-slate-800'
                          }`}>
                            {day.label}
                            {isToday && (
                              <span className="rounded-full bg-brand-200 px-1.5 py-0.5 text-[9px] font-extrabold text-brand-800">
                                Bugun
                              </span>
                            )}
                          </span>
                          <span className={`mt-0.5 block text-[10px] font-medium ${
                            isToday ? 'text-brand-600' : isPast ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {formatDayDate(date)}
                          </span>
                        </th>
                      )
                    })}
                  </tr>
                  <tr className="bg-slate-50 text-slate-600">
                    {DAYS.flatMap((day) => {
                      const date = getDayDate(monday, day.value)
                      const dateKey = toDateKey(date)
                      const isToday = isCurrentWeek && day.value === todayDay
                      const isPast = dateKey < todayDateKey
                      return PERIODS.map((period) => (
                        <th
                          key={`${day.value}-${period.number}`}
                          className={`border-b border-r border-slate-200 px-1 py-1.5 text-center last:border-r-0 ${
                            isToday ? 'bg-brand-50/70' : isPast ? 'bg-slate-100/50' : ''
                          }`}
                        >
                          <span className={`block text-[10px] font-bold ${isPast ? 'text-slate-400' : 'text-slate-700'}`}>{period.number}</span>
                          <span className="mt-0.5 block text-[8px] font-normal text-slate-400">{period.start}</span>
                        </th>
                      ))
                    })}
                  </tr>
                </thead>
                <tbody>
                  {visibleTeachers.map((teacher) => (
                    <tr key={teacher.id} className="group border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70">
                      <th scope="row" className="sticky left-0 z-[1] border-r border-slate-200 bg-surface px-4 py-2.5 text-left group-hover:bg-slate-50">
                        <span className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 text-xs font-bold text-white">
                            {teacher.name.slice(0, 1).toUpperCase()}
                          </span>
                          <span className="min-w-0">
                            <span className="block max-w-44 truncate text-xs font-semibold text-slate-800">
                              {teacher.name}
                              {teacher.isActive === false && (
                                <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-600">
                                  Nofaol
                                </span>
                              )}
                            </span>
                            <span className="mt-0.5 block max-w-44 truncate text-[10px] font-normal text-slate-500">{teacher.email}</span>
                          </span>
                        </span>
                      </th>
                      {DAYS.flatMap((day) => PERIODS.map((period) => {
                        const lesson = getLesson(teacher.id, day.value, period.number)
                        const roomLessons = getRoomLessons(day.value, period.number)
                        const roomSummary = roomLessons
                          .map((item) => `${item.room} (${item.teacher.name})`)
                          .join(', ')
                        const roomOccupancyHint = roomSummary ? `Band xonalar: ${roomSummary}` : 'Band xona yo‘q'
                        const busySlot = getBusySlot(teacher.id, day.value, period.number)
                        const belongsToGroupFilter = !groupFilter || Boolean(lesson?.groups.some((group) => group.id === groupFilter))
                        const isToday = isCurrentWeek && day.value === todayDay
                        const slotDate = getDayDate(monday, day.value)
                        const slotDateKey = toDateKey(slotDate)
                        const isPastOrToday = slotDateKey <= todayDateKey
                        const canClick = !busySlot && belongsToGroupFilter && (!isPastOrToday || Boolean(lesson))

                        if (lessonsLoading || availabilityLoading) {
                          return (
                            <td key={`${day.value}-${period.number}`} className={`border-r border-slate-100 p-0.5 ${isToday ? 'bg-brand-50/30' : ''}`}>
                              <Skeleton className="h-9 w-full rounded-md" />
                            </td>
                          )
                        }

                        return (
                          <td key={`${day.value}-${period.number}`} className={`border-r border-slate-100 p-0.5 ${isToday ? 'bg-brand-50/30' : ''}`}>
                            <button
                              type="button"
                              onClick={canClick ? () => setDialog({ teacher, day: day.value, period: period.number, lesson, isPastOrToday }) : undefined}
                              disabled={!canClick}
                              title={
                                busySlot
                                  ? `${teacher.name} · ${day.label} · ${period.number}-para band vaqt · ${roomOccupancyHint}`
                                  : lesson
                                  ? `${lessonGroupNames(lesson)} · ${lesson.subject.name} (${lessonTypeLabel(lesson.type)}) · ${lesson.teacher.name} · Xona: ${lesson.room || 'belgilanmagan'} · ${roomOccupancyHint}${isPastOrToday ? ' (o‘zgartirib bo‘lmaydi)' : ''}`
                                  : isPastOrToday
                                  ? `${day.label} (${formatDayDate(slotDate)}) — bugungi va o‘tgan kunga dars qo‘yib bo‘lmaydi (kamida 1 kun oldin rejalashtiriladi) · ${roomOccupancyHint}`
                                  : `${teacher.name} · ${day.label} · ${period.number}-para dars biriktirish · ${roomOccupancyHint}`
                              }
                              aria-label={
                                busySlot
                                  ? `${teacher.name}, ${day.label}, ${period.number}-para band vaqt. ${roomOccupancyHint}`
                                  : lesson
                                  ? `${lessonGroupNames(lesson)} ${lesson.subject.name}, xona ${lesson.room || 'belgilanmagan'}${belongsToGroupFilter ? ', ko‘rish yoki tahrirlash' : ', o‘qituvchi bu vaqtda band'}. ${roomOccupancyHint}`
                                  : isPastOrToday
                                  ? `${day.label}, ${period.number}-para dars qo‘yib bo‘lmaydi. ${roomOccupancyHint}`
                                  : `${teacher.name}, ${day.label}, ${period.number}-para dars biriktirish. ${roomOccupancyHint}`
                              }
                              className={`group/cell grid h-9 w-full place-items-center rounded-md border transition ${
                                busySlot
                                  ? 'cursor-not-allowed border-amber-300 bg-amber-100 text-amber-900'
                                  : lesson
                                  ? belongsToGroupFilter
                                    ? 'border-transparent hover:brightness-105'
                                    : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300'
                                  : isPastOrToday
                                  ? 'cursor-not-allowed border-dashed border-slate-200/80 bg-slate-100/60 text-slate-300'
                                  : 'border-transparent bg-slate-50/60 text-slate-300 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600'
                              }`}
                              style={!busySlot && lesson && belongsToGroupFilter ? {
                                backgroundColor: tint(lesson.subject.color, '1f'),
                                color: normalizeColor(lesson.subject.color),
                                boxShadow: `inset 0 0 0 1px ${tint(lesson.subject.color, '45')}`,
                              } as CSSProperties : undefined}
                            >
                              {busySlot ? (
                                <span className="max-w-full truncate px-0.5 text-[8px] font-extrabold uppercase tracking-wide">
                                  BAND
                                </span>
                              ) : lesson ? (
                                <span className="flex max-w-full items-center gap-0.5 truncate px-0.5 text-[8px] font-extrabold uppercase tracking-wide">
                                  <span className="shrink-0 rounded-sm bg-surface/70 px-0.5 leading-3">{lessonTypeShort(lesson.type)}</span>
                                  <span className="truncate">{lesson.subject.name.slice(0, 3)}</span>
                                </span>
                              ) : isPastOrToday ? (
                                <span className="text-[10px] text-slate-300 select-none">•</span>
                              ) : (
                                <AddRoundedIcon sx={{ fontSize: 13 }} className="opacity-0 transition-opacity group-hover/cell:opacity-100" />
                              )}
                            </button>
                          </td>
                        )
                      }))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-slate-100 px-4 py-4 sm:px-6">
            <Pagination
              page={teacherPage}
              totalPages={teachersPage.totalPages}
              total={teachersPage.total}
              limit={teachersPage.limit}
              onPageChange={changeTeacherPage}
            />
          </div>
          <p className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs leading-5 text-slate-500 sm:px-6">
            Bo‘sh katakni bosing — o‘qituvchi, hafta kuni va para modalda avtomatik tanlanadi. Xona bandligini katak ustiga olib borib yoki bo‘sh katakni bosib, “Xona” maydoni ostidagi ro‘yxatdan ko‘ring. Dars katagi ustiga olib borilganda uning xonasi ham ko‘rinadi. O‘qituvchi va talabalar oldindan bilishi uchun darslar faqat kamida 1 kun oldin (ertangi kundan boshlab) biriktiriladi; bugungi va o‘tgan kunlarga dars qo‘yib bo‘lmaydi. Sariq katak o‘qituvchi band qilgan vaqtni bildiradi. <span className="sm:hidden">Jadvalni yon tomonga suring.</span>
          </p>
        </Card>
      </div>

      {dialog && (
        <LessonDialog
          key={`${dialog.teacher.id}-${dialog.day}-${dialog.period}-${dialog.lesson?.id || 'new'}`}
          day={dialog.day}
          period={dialog.period}
          weekStart={weekStart}
          weekLabel={formatWeek(monday)}
          lesson={dialog.lesson}
          initialTeacherId={dialog.teacher.id}
          initialGroupId={groupFilter && isGroupFreeAtSlot(groupFilter, dialog.day, dialog.period) ? groupFilter : undefined}
          groups={groups}
          subjects={subjects}
          teachers={teachers}
          lessons={lessons}
          busy={isMutating}
          isPastOrToday={dialog.isPastOrToday}
          onClose={() => setDialog(null)}
          onSave={(values) => handleSave(values, dialog.lesson)}
          onDelete={dialog.lesson ? () => handleDelete(dialog.lesson!) : undefined}
        />
      )}
    </>
  )
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: ReactNode
  label: string
  value: number
  hint: string
  tone: 'brand' | 'info' | 'warning'
}) {
  return <MetricCard icon={icon} label={label} value={value} hint={hint} tone={({ brand: 'brand', info: 'sky', warning: 'amber' } as const)[tone]} />
}

function TableSkeleton({ groups }: { groups: number }) {
  return (
    <div className="overflow-hidden" aria-busy="true" aria-label="Jadval yuklanmoqda">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="ml-auto h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 6 }, (_, row) => (
          <div className="flex items-center gap-1.5 px-2 py-2" key={row}>
            <div className="flex w-60 shrink-0 items-center gap-2 px-2">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-2.5 w-28" />
                <Skeleton className="h-2 w-36" />
              </div>
            </div>
            {Array.from({ length: 16 }, (_, cell) => (
              <Skeleton className="h-9 flex-1 rounded-md" key={cell} />
            ))}
          </div>
        ))}
      </div>
      <p className="px-4 py-4 text-xs text-slate-500">
        O‘qituvchilar va darslar yuklanmoqda... {groups > 0 && `(${groups} guruh)`}
      </p>
    </div>
  )
}
