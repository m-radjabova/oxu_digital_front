import FilterSelect from '../../components/ui/FilterSelect'
import MetricCard from '../../components/ui/MetricCard'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded'
import { api } from '../../lib/api'
import { subscribeToRealtime } from '../../lib/realtime'
import useToast from '../../hooks/useToast'
import { formatDateTime } from '../../utils/date'
import { lessonGroupNames } from '../../utils/lessons'
import { periodRange } from '../../utils/periods'
import type { AttendanceDetails, AttendanceStatus } from '../../types'
import Button from '../../components/ui/Button'
import { buttonClass } from '../../components/ui/buttonStyles'
import { inputClass } from '../../components/ui/fieldStyles'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import { Table, Th, Td, Tr } from '../../components/ui/Table'
import { Skeleton } from '../../components/ui/Skeleton'

export default function AttendancePage() {
  const { lessonId } = useParams()
  const [searchParams] = useSearchParams()
  const date = searchParams.get('date') || ''
  const toast = useToast()
  const [details, setDetails] = useState<AttendanceDetails | null>(null)
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [note, setNote] = useState('')
  const loadSequence = useRef(0)

  const loadAttendance = useCallback(async ({
    fresh = false,
    resetStatuses = false,
  }: { fresh?: boolean; resetStatuses?: boolean } = {}) => {
    const sequence = ++loadSequence.current
    if (!lessonId) {
      setError('Dars topilmadi. Jadvaldan qayta urinib ko‘ring.')
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const result = await api<AttendanceDetails>(
        `/attendance/lessons/${lessonId}?date=${encodeURIComponent(date)}`,
        { dedupe: !fresh },
      )
      if (loadSequence.current !== sequence) return
      setDetails(result)
      setStatuses((current) => Object.fromEntries(result.students.map((student) => [
        student.id,
        resetStatuses ? 'present' as AttendanceStatus : current[student.id] || 'present',
      ])))
    } catch (requestError) {
      if (loadSequence.current === sequence) {
        setError(requestError instanceof Error ? requestError.message : 'Davomatni yuklab bo‘lmadi.')
      }
    } finally {
      if (loadSequence.current === sequence) setIsLoading(false)
    }
  }, [date, lessonId])

  useEffect(() => {
    let active = true
    async function loadInitialAttendance() {
      if (active) await loadAttendance({ resetStatuses: true })
    }
    void loadInitialAttendance()
    return () => {
      active = false
      loadSequence.current += 1
    }
  }, [loadAttendance])

  useEffect(() => subscribeToRealtime((event) => {
    if (event.type === 'reconnected') {
      void loadAttendance({ fresh: true })
      return
    }
    if (event.type === 'lessons:changed') {
      if (event.lessonId === lessonId) {
        void loadAttendance({ fresh: true })
      } else {
        const message = event.action === 'created'
          ? 'Yangi dars jadvalga biriktirildi. Jadvalga qaytsangiz yangilangan holat ko‘rinadi.'
          : 'Jadval o‘zgardi. Jadvalga qaytsangiz yangilangan holat ko‘rinadi.'
        toast.info(message, 'Jadval yangilandi')
      }
      return
    }
    if (event.type === 'attendance:changed' && event.lessonId === lessonId && event.date === date) {
      void loadAttendance({ fresh: true })
    }
  }), [date, lessonId, loadAttendance, toast])

  async function submitAttendance() {
    if (!details || !lessonId) return
    setIsSaving(true)
    try {
      await api(`/attendance/lessons/${lessonId}`, {
        method: 'POST',
        body: JSON.stringify({
          date: details.date,
          note,
          entries: details.students.map((student) => ({
            studentId: student.id,
            status: statuses[student.id] || 'present',
          })),
        }),
      })
      const saved = await api<AttendanceDetails>(
        `/attendance/lessons/${lessonId}?date=${encodeURIComponent(details.date)}`,
      )
      setDetails(saved)
      toast.success('Davomat saqlandi. Endi uni o‘zgartirib bo‘lmaydi.', 'Davomat')
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Davomatni saqlab bo‘lmadi.')
    } finally {
      setIsSaving(false)
    }
  }

  const attendanceTaken = Boolean(details?.attendance)
  const students = details?.students || []
  const rows = details?.attendance
    ? details.attendance.entries.map((entry, index) => ({ id: entry.student?.id || String(index), name: entry.student?.name || 'Talaba', email: entry.student?.email || '', group: students.find((student) => student.id === entry.student?.id)?.group, status: entry.status }))
    : students.map((student) => ({ ...student, status: statuses[student.id] || 'present' as AttendanceStatus }))
  const present = rows.filter((student) => student.status === 'present').length
  const absent = rows.length - present
  const percent = rows.length ? Math.round(present / rows.length * 100) : 0
  const visible = rows.filter((student) => (!groupFilter || student.group?.id === groupFilter) && `${student.name} ${student.email}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  const blocked = attendanceTaken || isSaving
  function setAll(status: AttendanceStatus) { if (!blocked) setStatuses(Object.fromEntries(students.map((student) => [student.id, status]))) }
  function copyPrevious() {
    const entries = details?.previousAttendance?.entries || []
    const previous = new Map(entries.filter((entry) => entry.student).map((entry) => [entry.student!.id, entry.status]))
    setStatuses(Object.fromEntries(students.map((student) => [student.id, previous.get(student.id) || statuses[student.id] || 'present'])))
    toast.success('Oldingi dars davomati nusxalandi. Tekshirib, saqlang.')
  }
  const year = Number(details?.date.slice(0, 4) || 0)
  const month = Number(details?.date.slice(5, 7) || 0)
  const academicYear = month >= 9 ? year : year - 1

  return <div className="mx-auto w-full max-w-[1600px] px-3 py-4 pb-6 sm:px-4 lg:px-5">
    <header className="mb-6 flex items-center gap-4">
      <FactCheckOutlinedIcon className="text-brand-700" sx={{ fontSize: 42 }} />
      <div><h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Davomatni olish</h1><p className="mt-1 text-sm text-slate-500 sm:text-base">Darsga qatnashgan va qatnashmagan talabalarni belgilang.</p></div>
    </header>
    {isLoading ? <div className="space-y-5" aria-busy="true"><Skeleton className="h-24 rounded-2xl" /><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[1,2,3,4].map((n) => <Skeleton key={n} className="h-28 rounded-2xl" />)}</div><Skeleton className="h-96 rounded-2xl" /></div>
    : error || !details ? <Card><EmptyState icon={<FactCheckOutlinedIcon />} title="Davomatni yuklab bo‘lmadi" description={error || 'Dars topilmadi.'} action={<Button onClick={() => void loadAttendance()}>Qayta urinish</Button>} /></Card>
    : <>
      <Card className="mb-5 grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-[1.15fr_1.2fr_1fr_1fr_1.1fr]">
        <ContextField label="Semestr"><div className={`${inputClass} flex items-center bg-slate-50/50 font-semibold`}>{academicYear}/{academicYear + 1} – {month >= 9 ? 'Kuzgi' : 'Bahorgi'}</div></ContextField>
        <ContextField label="Fan"><div className={`${inputClass} flex items-center overflow-hidden bg-slate-50/50 font-semibold`} title={details.lesson.subject.name}><span className="truncate">{details.lesson.subject.name}</span></div></ContextField>
        <ContextField label="Guruh"><FilterSelect icon={<GroupsRoundedIcon />} aria-label="Guruh bo‘yicha filtrlash" className={inputClass} value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}><option value="">{details.lesson.groups.length === 1 ? details.lesson.groups[0].name : 'Barcha guruhlar'}</option>{details.lesson.groups.length > 1 && details.lesson.groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</FilterSelect></ContextField>
        <ContextField label="Dars sanasi"><div className={`${inputClass} flex items-center gap-2 font-semibold`}><CalendarTodayRoundedIcon sx={{ fontSize: 19 }} className="text-brand-700" />{details.date.split('-').reverse().join('.')}</div></ContextField>
        <ContextField label="Para"><div className={`${inputClass} flex items-center whitespace-nowrap text-xs font-semibold`}>{details.lesson.period}-para ({periodRange(details.lesson.period)})</div></ContextField>
      </Card>
      <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-[1fr_1fr_1fr_1.2fr]" aria-live="polite">
        <StatCard icon={<GroupsRoundedIcon />} value={rows.length} label="Jami talabalar" tone="brand" />
        <StatCard icon={<CheckRoundedIcon />} value={present} label="Qatnashdi" tone="success" />
        <StatCard icon={<CloseRoundedIcon />} value={absent} label="Qatnashmadi" tone="danger" />
        <Card className="flex items-center gap-4 p-4 sm:p-5"><div className="relative grid size-20 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(var(--color-brand-600) ${percent}%, var(--color-brand-100) 0)` }}><div className="grid size-16 place-items-center rounded-full bg-surface text-xl font-extrabold text-slate-900">{percent}%</div></div><div><h2 className="font-bold text-slate-900">Davomat foizi</h2><p className="mt-1 text-xs text-slate-500">Tanlangan dars bo‘yicha</p></div></Card>
      </div>
      {details.attendance && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Davomat saqlangan · {formatDateTime(details.attendance.takenAt)}. Saqlangan davomatni o‘zgartirib bo‘lmaydi.</div>}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2.2fr)_minmax(300px,1fr)]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4"><h2 className="text-lg font-bold text-slate-900">Talabalar ro‘yxati ({rows.length})</h2><div className="relative w-full sm:max-w-xs"><SearchRoundedIcon sx={{ fontSize: 20 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Talaba bo‘yicha qidirish" className={`filter-search ${inputClass} mt-0 h-10 pl-10`} placeholder="Talaba bo‘yicha qidirish..." value={query} onChange={(e) => setQuery(e.target.value)} /></div></div>
          <div className="max-h-[520px] overflow-auto">
          <Table minWidth="min-w-[620px]" caption="Talabalar davomati"><thead className="sticky top-0 z-10"><tr><Th><input type="checkbox" className="size-4 accent-brand-600" aria-label="Barchani qatnashdi deb belgilash" disabled={blocked || !rows.length} checked={rows.length > 0 && present === rows.length} ref={(el) => { if (el) el.indeterminate = present > 0 && present < rows.length }} onChange={(e) => setAll(e.target.checked ? 'present' : 'absent')} /></Th><Th>№</Th><Th icon={<PersonRoundedIcon />}>F.I.O.</Th><Th icon={<GroupsRoundedIcon />}>Guruh</Th><Th icon={<VerifiedRoundedIcon />}>Status</Th></tr></thead><tbody>{visible.map((student, index) => <Tr key={student.id}><Td><input type="checkbox" className="size-4 cursor-pointer accent-brand-600 disabled:cursor-default" aria-label={`${student.name}: qatnashdi`} disabled={blocked} checked={student.status === 'present'} onChange={(e) => setStatuses((current) => ({ ...current, [student.id]: e.target.checked ? 'present' : 'absent' }))} /></Td><Td className="text-slate-400">{index + 1}</Td><Td><div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{student.name.split(' ').slice(0, 2).map((part) => part[0]).join('')}</span><b className="text-sm text-slate-800">{student.name}</b></div></Td><Td className="whitespace-nowrap text-slate-600">{student.group?.name || lessonGroupNames(details.lesson)}</Td><Td><button type="button" disabled={blocked} aria-label={`${student.name} davomat holatini almashtirish`} onClick={() => setStatuses((current) => ({ ...current, [student.id]: student.status === 'present' ? 'absent' : 'present' }))} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 ${student.status === 'present' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>{student.status === 'present' ? <CheckRoundedIcon sx={{ fontSize: 17 }} /> : <CloseRoundedIcon sx={{ fontSize: 17 }} />}{student.status === 'present' ? 'Qatnashdi' : 'Qatnashmadi'}</button></Td></Tr>)}</tbody></Table>
          {!visible.length && <EmptyState icon={<GroupsRoundedIcon />} title={rows.length ? 'Talaba topilmadi' : 'Guruhda faol talaba yo‘q'} description={rows.length ? 'Qidiruv yoki guruh filtrini o‘zgartiring.' : 'Talabalar guruhga biriktirilgach bu yerda ko‘rinadi.'} />}
          </div>
          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-surface p-4 sm:px-6"><Link to="/teacher/schedule" className={buttonClass({ variant: 'secondary', size: 'md' })}>{attendanceTaken ? 'Jadvalga qaytish' : 'Bekor qilish'}</Link>{!attendanceTaken && <Button loading={isSaving} loadingText="Saqlanmoqda..." disabled={!students.length} startIcon={<SaveRoundedIcon sx={{ fontSize: 19 }} />} onClick={() => void submitAttendance()}>Davomatni saqlash</Button>}</div>
        </Card>
        <Card className="p-3 sm:p-4"><h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-900"><BoltRoundedIcon className="text-brand-600" />Tezkor amallar</h2><div className="space-y-3"><Button fullWidth variant="secondary" className="min-h-12 justify-start border-brand-300 bg-brand-50 text-brand-700" disabled={blocked || !students.length} startIcon={<CheckRoundedIcon />} onClick={() => setAll('present')}>Barchani qatnashdi deb belgilash</Button><Button fullWidth variant="secondary" className="min-h-12 justify-start" disabled={blocked || !students.length} startIcon={<CloseRoundedIcon />} onClick={() => setAll('absent')}>Barchani qatnashmadi deb belgilash</Button><Button fullWidth variant="secondary" className="min-h-12 justify-start" disabled={blocked || !details.previousAttendance} startIcon={<ContentCopyRoundedIcon sx={{ fontSize: 20 }} />} onClick={copyPrevious}>Oldingi dars davomatini nusxalash</Button>{!details.previousAttendance && !attendanceTaken && <p className="text-xs leading-5 text-slate-400">Shu fan va guruhlar uchun oldingi davomat mavjud emas.</p>}</div><label className="mt-7 block"><span className="text-sm font-bold text-slate-800">Izoh <span className="font-normal text-slate-400">(ixtiyoriy)</span></span><textarea className={`${inputClass} min-h-32 resize-y py-3`} rows={4} maxLength={1000} disabled={blocked} value={details.attendance?.note || (attendanceTaken ? '' : note)} onChange={(e) => setNote(e.target.value)} placeholder="Masalan: kechikib keldi, sababli qoldi va h.k." /></label></Card>
      </div>
    </>}
  </div>
}

function ContextField({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0"><span className="text-xs font-semibold text-slate-500">{label}</span>{children}</div>
}

function StatCard({ icon, value, label, tone }: { icon: ReactNode; value: number; label: string; tone: 'brand' | 'success' | 'danger' }) {
  return <MetricCard icon={icon} label={label} value={value} tone={({ brand: 'brand', success: 'emerald', danger: 'rose' } as const)[tone]} />
}
