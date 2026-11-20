import { useMemo, useState } from 'react'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import { useGroups } from '../hooks/useGroups'
import { useLessons } from '../hooks/useLessons'
import { useAcademicStructure } from '../hooks/useAcademicStructure'
import { addDays, formatDate, formatWeekRange, getTodayDateKey, startOfWeek, toDateKey } from '../utils/date'
import { PERIODS } from '../utils/periods'
import { lessonTypeLabel } from '../utils/lessons'
import PageHeading from './PageHeading'
import FilterSelect from './ui/FilterSelect'
import Button from './ui/Button'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import FilterAltOffRoundedIcon from '@mui/icons-material/FilterAltOffRounded'
import { Skeleton } from './ui/Skeleton'
import EmptyState from './ui/EmptyState'
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined'
import LaptopChromebookRoundedIcon from '@mui/icons-material/LaptopChromebookRounded'

const DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
const colors = {
  lecture: 'border-violet-200 bg-violet-100/80 text-violet-950',
  practice: 'border-sky-200 bg-sky-100/80 text-sky-950',
  lab: 'border-emerald-200 bg-emerald-100/80 text-emerald-950',
}
const selectClass = 'h-11 min-w-0 rounded-xl border border-slate-200 bg-surface px-3 text-sm font-medium normal-case tracking-normal text-slate-700 shadow-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100'
const filterLabelClass = 'grid min-w-0 gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500'

export default function GroupScheduleGrid() {
  const { data: groups, isLoading: groupsLoading, error: groupsError, refresh: refreshGroups } = useGroups()
  const structure = useAcademicStructure()
  const [monday, setMonday] = useState(() => startOfWeek(getTodayDateKey()))
  const weekStart = toDateKey(monday)
  const { data: lessons, isLoading: lessonsLoading, error: lessonsError, refresh: refreshLessons } = useLessons(true, { weekStart })
  const [faculty, setFaculty] = useState('')
  const [direction, setDirection] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [search, setSearch] = useState('')
  const directions = structure.directions.filter((item) => !faculty || item.department.faculty.id === faculty)
  const filteredGroups = useMemo(() => groups.filter((group) =>
    (!faculty || group.direction?.department.faculty.id === faculty) &&
    (!direction || group.direction?.id === direction) &&
    group.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  ), [groups, faculty, direction, search])
  const selected = filteredGroups.find((group) => group.id === selectedId) || filteredGroups[0]
  const weeklyLessons = useMemo(() => lessons.filter((lesson) => lesson.weekStart === weekStart), [lessons, weekStart])
  const groupLessons = weeklyLessons.filter((lesson) => lesson.groups.some((group) => group.id === selected?.id))
  const counts = useMemo(() => {
    const result = new Map<string, number>()
    for (const lesson of weeklyLessons) for (const group of lesson.groups) result.set(group.id, (result.get(group.id) || 0) + 1)
    return result
  }, [weeklyLessons])
  const error = groupsError || lessonsError || structure.error
  const loading = groupsLoading || lessonsLoading
  const today = getTodayDateKey()
  const visiblePeriods = PERIODS.filter((period) => period.number <= Math.max(6, ...groupLessons.map((lesson) => lesson.period)))

  return <div className="mx-auto w-full max-w-[1800px] px-3 pb-6 sm:px-4 lg:px-5">
    <PageHeading eyebrow="Administrator kabineti" title="Guruhlar dars jadvali" description="Guruhlarni tanlang va haftalik darslar taqsimotini ko‘ring." icon={<CalendarMonthRoundedIcon />} />
    {error && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-rose-50 p-4 text-sm text-rose-800"><span>{error}</span><button className="font-bold underline" onClick={() => { void refreshGroups(); void refreshLessons(); void structure.refresh() }}>Qayta urinish</button></div>}
    <div className="mb-5 rounded-2xl border border-slate-200/70 bg-surface p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <span className="flex items-center gap-2 text-sm font-bold text-slate-800"><span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-700"><TuneRoundedIcon sx={{ fontSize: 18 }} /></span>Jadval filtrlari</span>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${faculty || direction || selectedId || search ? 'bg-brand-50 text-brand-700' : 'bg-slate-50 text-slate-500'}`}>{faculty || direction || selectedId || search ? `${[faculty, direction, selectedId, search].filter(Boolean).length} ta faol filtr` : 'Barcha natijalar'}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <label className={filterLabelClass}>Fakultet
          {structure.isLoading ? <Skeleton className="h-11 w-full rounded-xl" /> : <FilterSelect icon={<AccountBalanceRoundedIcon />} className={selectClass} value={faculty} onChange={(e) => { setFaculty(e.target.value); setDirection(''); setSelectedId('') }}><option value="">Barcha fakultetlar</option>{structure.faculties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</FilterSelect>}
        </label>
        <label className={filterLabelClass}>Yo‘nalish
          {structure.isLoading ? <Skeleton className="h-11 w-full rounded-xl" /> : <FilterSelect icon={<AccountTreeRoundedIcon />} disabled={!directions.length} className={selectClass} value={direction} onChange={(e) => { setDirection(e.target.value); setSelectedId('') }}><option value="">Barcha yo‘nalishlar</option>{directions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</FilterSelect>}
        </label>
        <label className={`${filterLabelClass} sm:col-span-2 xl:col-span-1`}>Guruh
          {groupsLoading ? <Skeleton className="h-11 w-full rounded-xl" /> : <FilterSelect icon={<GroupsRoundedIcon />} disabled={!filteredGroups.length} className={selectClass} value={selected?.id || ''} onChange={(e) => setSelectedId(e.target.value)}><option value="">Guruh tanlang</option>{filteredGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</FilterSelect>}
        </label>
      </div>
      {(faculty || direction || selectedId || search) && <div className="mt-3 flex justify-end"><Button variant="ghost" size="sm" startIcon={<FilterAltOffRoundedIcon sx={{ fontSize: 16 }} />} onClick={() => { setFaculty(''); setDirection(''); setSelectedId(''); setSearch('') }}>Filtrlarni tozalash</Button></div>}
    </div>
    <div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)] 2xl:grid-cols-[270px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-slate-200/70 bg-surface p-4 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="text-base font-bold text-slate-900">Guruhlar</h2><span className="rounded-lg bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">{groupsLoading ? <Skeleton className="h-4 w-5" /> : filteredGroups.length}</span></div><div className="relative"><SearchRoundedIcon className="absolute left-3 top-3 text-slate-400" sx={{ fontSize: 20 }} /><input className="h-11 w-full rounded-xl border border-slate-200 bg-transparent pl-10 pr-3 text-sm outline-none focus:border-indigo-500" aria-label="Guruh nomini qidirish" placeholder="Guruh nomini qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <div className="mt-3 max-h-64 space-y-1 lg:max-h-[780px] overflow-y-auto">{groupsLoading ? <GroupListSkeleton /> : filteredGroups.map((group) => <button key={group.id} type="button" onClick={() => setSelectedId(group.id)} aria-pressed={selected?.id === group.id} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-5 text-left transition ${selected?.id === group.id ? 'border-brand-300 bg-brand-50 text-brand-900 shadow-sm ring-1 ring-brand-100' : 'border-transparent border-b-slate-100 text-slate-700 hover:bg-slate-50'}`}><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700"><GroupsRoundedIcon /></span><span className="min-w-0"><b className="block break-words text-base">{group.name}</b><span className="mt-1 flex items-center gap-1 text-xs text-slate-500">{group.studentCount ?? 0} talaba <span className="text-slate-300">·</span> {lessonsLoading ? <Skeleton className="h-3 w-10" /> : `${counts.get(group.id) || 0} para`}</span></span></button>)}{!filteredGroups.length && !groupsLoading && <p className="p-3 text-sm text-slate-500">Guruhlar topilmadi.</p>}</div>
      </aside>
      <section className="min-w-0 rounded-2xl border border-slate-200/70 bg-surface p-4 shadow-sm sm:p-5"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold text-slate-900">{selected ? `${selected.name} guruhi dars jadvali` : 'Guruh dars jadvali'}</h2><div className="flex max-w-full flex-wrap items-center gap-2"><button type="button" aria-label="Oldingi hafta" className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-indigo-50" onClick={() => setMonday(addDays(monday, -7))}><ChevronLeftRoundedIcon /></button><span className="rounded-xl border border-slate-200 px-3 py-2 text-center text-sm font-bold text-slate-700"><CalendarMonthRoundedIcon sx={{ fontSize: 18 }} /> {formatWeekRange(monday, addDays(monday, 5))}</span><button type="button" aria-label="Keyingi hafta" className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-indigo-50" onClick={() => setMonday(addDays(monday, 7))}><ChevronRightRoundedIcon /></button><button type="button" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50" onClick={() => setMonday(startOfWeek(getTodayDateKey()))}>Bugun</button></div></div>
        {loading ? <ScheduleSkeleton periods={visiblePeriods.length} /> : !selected ? <EmptyState icon={<GroupsRoundedIcon />} title="Guruh topilmadi" description="Qidiruv yoki filtrlarni o‘zgartirib ko‘ring." /> : <>{!groupLessons.length && !error && <div className="mb-4 flex items-center gap-3 rounded-xl border border-dashed border-brand-200 bg-brand-50/50 p-4 text-sm text-brand-800"><CalendarMonthRoundedIcon sx={{ fontSize: 20 }} />Bu hafta uchun guruhga dars biriktirilmagan.</div>}<div tabIndex={0} role="region" aria-label="Guruhning haftalik dars jadvali" className="max-h-[850px] overflow-auto rounded-xl border border-slate-200 focus-visible:outline-brand-500"><table className="w-full min-w-[1150px] table-fixed border-collapse text-sm"><thead className="sticky top-0 z-20"><tr className="bg-slate-50"><th className="sticky left-0 z-30 w-32 border-b border-r border-slate-200 bg-slate-50 p-3 text-left text-slate-700">Para</th>{DAYS.map((day, index) => <th key={day} className={`border-b border-r border-slate-200 p-3 text-center last:border-r-0 ${toDateKey(addDays(monday, index)) === today ? 'bg-brand-50 text-brand-700' : 'bg-slate-50'}`}><span className="block text-slate-800">{day}</span><span className="mt-1 block text-xs font-normal text-slate-500">{formatDate(addDays(monday, index))}</span><span className="mt-2 inline-block rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-slate-500">{groupLessons.filter((lesson) => lesson.dayOfWeek === index + 1).length} para</span></th>)}</tr></thead><tbody>{visiblePeriods.map((period) => <tr key={period.number}><th className="sticky left-0 z-10 border-b border-r border-slate-200 bg-surface px-3 py-5 text-left align-middle"><span className="block text-base text-slate-900">{period.number}-para</span><span className="mt-1 block whitespace-nowrap text-xs font-medium text-slate-500">{period.start} – {period.end}</span></th>{DAYS.map((day, index) => { const slotLessons = groupLessons.filter((lesson) => lesson.dayOfWeek === index + 1 && lesson.period === period.number); return <td key={day} className="h-28 border-b border-r border-slate-200 p-1 align-top last:border-r-0">{slotLessons.length ? slotLessons.map((lesson) => <article key={lesson.id} title={lessonTypeLabel(lesson.type)} className={`flex min-h-28 items-start gap-2.5 rounded-xl border border-transparent px-3 py-3 ${colors[lesson.type] || colors.lecture}`}>
                    <span className="mt-0.5 shrink-0 opacity-80" aria-hidden="true">{lesson.type === 'lab' ? <ScienceOutlinedIcon sx={{ fontSize: 25 }} /> : lesson.type === 'practice' ? <LaptopChromebookRoundedIcon sx={{ fontSize: 25 }} /> : <MenuBookRoundedIcon sx={{ fontSize: 25 }} />}</span>
                    <div className="min-w-0 flex-1"><h3 className="break-words text-sm font-bold leading-5">{lesson.subject.name}</h3><p className="mt-1 break-words text-[13px] font-medium leading-5 opacity-75">{lesson.teacher.name}</p><p className="mt-0.5 break-words text-[13px] font-bold leading-5">{lesson.room || 'Xona belgilanmagan'}</p><span className="sr-only">{lessonTypeLabel(lesson.type)}</span></div>
                  </article>) : <div className="grid h-full min-h-28 place-items-center text-xl text-slate-400">—</div>}</td> })}</tr>)}</tbody></table></div><p className="mt-2 text-xs text-slate-400 lg:hidden">Jadvalning qolgan qismini ko‘rish uchun yon tomonga suring.</p></>}
      </section>
    </div>
    {selected && <div className="mt-5 flex flex-wrap items-center gap-6 rounded-2xl border border-slate-100 bg-surface p-5 shadow-sm"><div className="flex items-center gap-3"><GroupsRoundedIcon className="text-violet-600" /><div><b className="block text-slate-900">{selected.name}</b><span className="text-xs text-slate-500">Guruh ma’lumotlari</span></div></div><div><b className="block text-slate-900">{loading ? <Skeleton className="inline-block h-5 w-8" /> : groupLessons.length} para</b><span className="text-xs text-slate-500">Haftalik yuklama</span></div><div><b className="block text-slate-900"><MenuBookRoundedIcon sx={{ fontSize: 18 }} /> {loading ? <Skeleton className="inline-block h-5 w-8" /> : new Set(groupLessons.map((lesson) => lesson.subject.id)).size} fan</b><span className="text-xs text-slate-500">Jadvaldagi fanlar</span></div><div><b className="block text-slate-900">{selected.studentCount ?? 0} talaba</b><span className="text-xs text-slate-500">Guruh tarkibi</span></div><div className="flex flex-wrap gap-3 text-xs text-slate-600"><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-violet-500" />Ma’ruza</span><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-sky-500" />Amaliyot</span><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-emerald-500" />Laboratoriya</span></div></div>}
  </div>
}


function GroupListSkeleton() {
  return <div role="status" aria-label="Guruhlar yuklanmoqda" className="space-y-2">
    {Array.from({ length: 6 }, (_, index) => <div key={index} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><Skeleton className="size-10 shrink-0 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-32" /></div></div>)}
  </div>
}

function ScheduleSkeleton({ periods }: { periods: number }) {
  return <div role="status" aria-label="Dars jadvali yuklanmoqda" aria-busy="true" className="overflow-hidden rounded-xl border border-slate-200">
    <span className="sr-only">Dars jadvali yuklanmoqda...</span>
    <div className="min-w-[1150px]">
      <div className="grid grid-cols-[128px_repeat(6,minmax(0,1fr))] border-b border-slate-200 bg-slate-50">{Array.from({ length: 7 }, (_, index) => <div key={index} className="space-y-2 border-r border-slate-100 p-4"><Skeleton className="h-4 w-20" /><Skeleton className="h-3 w-14" /><Skeleton className="h-4 w-10" /></div>)}</div>
      {PERIODS.slice(0, periods).map((period) => <div key={period.number} className="grid grid-cols-[128px_repeat(6,minmax(0,1fr))] border-b border-slate-100 last:border-0"><div className="space-y-2 border-r border-slate-100 p-3"><Skeleton className="h-4 w-14" /><Skeleton className="h-3 w-20" /></div>{DAYS.map((day, index) => <div key={day} className="h-32 border-r border-slate-100 p-1.5">{(period.number + index) % 3 !== 0 && <div className="h-full space-y-3 rounded-xl border border-slate-100 p-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-4/5" /><Skeleton className="h-3 w-3/5" /><Skeleton className="h-3 w-12" /></div>}</div>)}</div>)}
    </div>
  </div>
}
