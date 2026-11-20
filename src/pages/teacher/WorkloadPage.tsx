import { useCallback, useEffect, useMemo, useState } from 'react'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded'
import LayersRoundedIcon from '@mui/icons-material/LayersRounded'
import PrintRoundedIcon from '@mui/icons-material/PrintRounded'
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import { api, apiDownload } from '../../lib/api'
import { subscribeToRealtime } from '../../lib/realtime'
import { getTodayDateKey } from '../../utils/date'
import Pagination from '../../components/Pagination'
import { Skeleton } from '../../components/ui/Skeleton'
import Button from '../../components/ui/Button'
import FilterSelect from '../../components/ui/FilterSelect'
import { inputClass } from '../../components/ui/fieldStyles'

type Kind = 'lecture' | 'practice' | 'lab'
type Totals = Record<Kind | 'total', number>
type Row = { subjectId: string; subject: string; code: string; groups: string[]; groupIds: string[]; type: Kind; hours: number; completed: number; students: number }
type Workload = { year: number; years: number[]; semester: string; teacher: { name: string; email: string; departments: string[] }; totals: Totals; annual: Totals; rows: Row[] }
const typeLabels: Record<Kind, string> = { lecture: 'Ma’ruza', practice: 'Amaliyot', lab: 'Laboratoriya' }
const colors: Record<Kind, string> = { lecture: '#2563eb', practice: '#14b8a6', lab: '#a78bfa' }
const tones: Record<Kind, string> = { lecture: 'bg-blue-50 text-blue-700', practice: 'bg-teal-50 text-teal-700', lab: 'bg-violet-50 text-violet-700' }
const limit = 10

function todayAcademicYear() {
  const [year, month] = getTodayDateKey().split('-').map(Number)
  return month >= 9 ? year : year - 1
}
function WorkloadSkeleton() {
  return <div role="status" aria-live="polite" aria-busy="true" className="space-y-5">
    <span className="sr-only">Yuklama ma’lumotlari yuklanmoqda</span>
    <div aria-hidden="true" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => <div key={index} className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-surface p-5 shadow-sm">
        <Skeleton className="size-12 shrink-0 rounded-2xl" /><div className="flex-1 space-y-3"><Skeleton className="h-3 w-32 max-w-full" /><Skeleton className="h-7 w-24" /></div>
      </div>)}
    </div>
    <div aria-hidden="true" className="flex flex-wrap items-center gap-5 rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm">
      <Skeleton className="size-12 shrink-0 rounded-full" />
      <div className="min-w-32 space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-4 w-36" /></div>
      <div className="hidden h-10 w-px bg-slate-100 sm:block" />
      <div className="min-w-40 flex-1 space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-4 w-48 max-w-full" /></div>
      <div className="hidden space-y-2 md:block"><Skeleton className="h-3 w-14" /><Skeleton className="h-4 w-36" /></div>
    </div>
    <div aria-hidden="true" className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3"><Skeleton className="h-5 w-48" /><Skeleton className="h-3 w-16" /></div>
        <div className="rounded-xl bg-slate-50 px-4 py-4"><div className="grid grid-cols-4 gap-4"><Skeleton className="h-3 w-12" /><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-12" /></div></div>
        <div className="divide-y divide-slate-100">{Array.from({ length: 5 }, (_, index) => <div key={index} className="grid grid-cols-4 items-center gap-4 px-4 py-5"><Skeleton className="h-3.5 w-14 max-w-full" /><div className="space-y-2"><Skeleton className="h-3.5 w-32 max-w-full" /><Skeleton className="h-2.5 w-16 max-w-full" /></div><Skeleton className="h-6 w-20 max-w-full rounded-md" /><Skeleton className="h-3.5 w-12 max-w-full" /></div>)}</div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1"><div className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm"><Skeleton className="h-5 w-36" /><div className="mt-6 flex items-center justify-center gap-5"><Skeleton className="size-36 shrink-0 rounded-full" /><div className="space-y-3"><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-24" /><Skeleton className="h-3 w-20" /></div></div></div><div className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm"><Skeleton className="h-4 w-40" /><Skeleton className="mt-4 h-8 w-28" /><Skeleton className="mt-3 h-3 w-32" /></div></div>
    </div>
  </div>
}

export default function WorkloadPage() {
  const [year, setYear] = useState(todayAcademicYear)
  const [semester, setSemester] = useState(() => { const month = Number(getTodayDateKey().slice(5, 7)); return month >= 9 || month === 1 ? 'fall' : 'spring' })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState<{ key: string; data?: Workload; error?: string } | null>(null)
  const [downloadError, setDownloadError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const params = useMemo(() => new URLSearchParams({ year: String(year), semester, q: search.trim() }).toString(), [year, semester, search])
  const key = `${params}:${version}`
  const refresh = useCallback(() => setVersion((v) => v + 1), [])
  useEffect(() => {
    let active = true
    api<Workload>(`/lessons/my-workload?${params}`, { dedupe: false }).then((data) => { if (active) setResult({ key, data }) }).catch((error) => { if (active) setResult({ key, error: error instanceof Error ? error.message : 'Yuklamani olishda xatolik.' }) })
    return () => { active = false }
  }, [params, key])
  useEffect(() => subscribeToRealtime((event) => { if (event.type === 'lessons:changed' || event.type === 'attendance:changed' || event.type === 'reconnected') refresh() }), [refresh])
  const loading = result?.key !== key
  const data = !loading ? result?.data : undefined
  const rows = data?.rows || []
  const totalPages = Math.max(1, Math.ceil(rows.length / limit))
  const displayRows = rows.slice((page - 1) * limit, page * limit)
  const progress = data?.totals || { lecture: 0, practice: 0, lab: 0, total: 0 }
  const p1 = progress.total ? progress.lecture / progress.total * 100 : 0
  const p2 = progress.total ? (progress.lecture + progress.practice) / progress.total * 100 : 0
  const years = [...new Set([year, ...(result?.data?.years || [])])].sort((a, b) => b - a)
  async function download() {
    setDownloading(true); setDownloadError('')
    try {
      const blob = await apiDownload(`/lessons/my-workload/export?${params}`)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a'); link.href = url; link.download = `mening-yuklamalarim-${year}.xlsx`; link.click(); URL.revokeObjectURL(url)
    } catch (error) { setDownloadError(error instanceof Error ? error.message : 'Excel faylini yuklab bo‘lmadi.') } finally { setDownloading(false) }
  }
  const stats = [
    { label: 'Tanlangan davr yuklamasi', value: progress.total, icon: <LayersRoundedIcon />, tone: 'bg-gradient-to-br from-blue-600 to-blue-900 text-white', iconTone: 'bg-white/20 text-white' },
    { label: 'Ma’ruza', value: progress.lecture, icon: <MenuBookRoundedIcon />, tone: 'bg-blue-50 text-blue-950', iconTone: 'bg-blue-100 text-blue-600' },
    { label: 'Amaliyot', value: progress.practice, icon: <GroupsRoundedIcon />, tone: 'bg-teal-50 text-teal-950', iconTone: 'bg-teal-100 text-teal-700' },
    { label: 'Laboratoriya', value: progress.lab, icon: <ScienceRoundedIcon />, tone: 'bg-violet-50 text-violet-950', iconTone: 'bg-violet-100 text-violet-700' },
  ]
  function table(list: Row[], start: number) { return <table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#102d54] text-xs text-white"><tr><th className="px-3 py-3">№</th><th className="px-3 py-3">Guruh</th><th className="px-3 py-3">Fan nomi</th><th className="px-3 py-3">Dars turi</th><th className="px-3 py-3">Reja</th><th className="px-3 py-3">O‘tilgan</th><th className="px-3 py-3">Talabalar</th></tr></thead><tbody>{list.map((row, index) => <tr className="border-b border-slate-100 even:bg-slate-50/70" key={`${row.subjectId}-${row.type}-${row.groupIds.join('-')}`}><td className="px-3 py-3 text-slate-500">{start + index + 1}</td><td className="px-3 py-3 font-semibold text-slate-700">{row.groups.join(', ')}</td><td className="px-3 py-3 font-medium text-slate-800">{row.subject}<small className="block text-slate-400">{row.code}</small></td><td className="px-3 py-3"><span className={`rounded-md px-2 py-1 text-xs font-bold ${tones[row.type]}`}>{typeLabels[row.type]}</span></td><td className="px-3 py-3 font-semibold">{row.hours} soat</td><td className="px-3 py-3">{row.completed} soat</td><td className="px-3 py-3">{row.students}</td></tr>)}</tbody></table> }
  return <div id="teacher-workload" className="mx-auto w-full max-w-[1600px] space-y-5 px-3 pb-8 pt-4 sm:px-5">
    <style>{'@media print { body * { visibility: hidden !important; } #teacher-workload, #teacher-workload * { visibility: visible !important; } #teacher-workload { position: absolute; inset: 0; width: 100%; max-width: none; padding: 0; } .workload-no-print { display: none !important; } .workload-print { display: block !important; } }'}</style>
    <header className="flex items-start gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-700"><SchoolRoundedIcon sx={{ fontSize: 29 }} /></span><div><h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">O‘qituvchi yuklamasi</h1><p className="mt-1 text-sm text-slate-500">Semestr va yillik dars yuklamalari tahlili</p></div></header>
    <div className="workload-no-print grid gap-3 md:grid-cols-2 xl:grid-cols-[170px_190px_minmax(200px,1fr)_auto_auto]">
      <FilterSelect aria-label="O‘quv yili" value={year} onChange={(e) => { setYear(Number(e.target.value)); setPage(1) }}>{years.map((y) => <option value={y} key={y}>{y}–{y + 1} o‘quv yili</option>)}</FilterSelect>
      <FilterSelect aria-label="Semestr" value={semester} onChange={(e) => { setSemester(e.target.value); setPage(1) }}><option value="fall">Kuzgi semestr</option><option value="spring">Bahorgi semestr</option><option value="all">Butun o‘quv yili</option></FilterSelect>
      <div className="relative"><SearchRoundedIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" sx={{ fontSize: 20 }} /><input className={`${inputClass} !mt-0 h-11 pl-10`} aria-label="Fan yoki guruhni qidirish" placeholder="Guruh, fan nomi yoki kodi..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} /></div>
      <Button variant="secondary" startIcon={<PrintRoundedIcon />} disabled={loading || !data} onClick={() => window.print()}>Chop etish</Button>
      <Button variant="secondary" startIcon={<FileDownloadRoundedIcon />} loading={downloading} disabled={loading || !data} onClick={() => void download()}>Excelga eksport</Button>
    </div>
    <p className="text-xs text-slate-500">Kuzgi semestr: sentabr–yanvar; bahorgi semestr: fevral–avgust. Har bir dars o‘qituvchi yuklamasida bir marta hisoblanadi.</p>
    {downloadError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{downloadError}</p>}
    {loading ? <WorkloadSkeleton /> : result?.error ? <div role="alert" className="rounded-2xl bg-rose-50 p-5 text-sm text-rose-700">{result.error} <button onClick={refresh} className="font-bold underline">Qayta urinish</button></div> : data && <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map((item) => <div key={item.label} className={`flex items-center gap-4 rounded-2xl p-5 shadow-sm ${item.tone}`}><span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${item.iconTone}`}>{item.icon}</span><div><p className="text-sm font-semibold opacity-80">{item.label}</p><p className="mt-1 text-2xl font-extrabold">{item.value} <span className="text-base">soat</span></p></div></div>)}</div>
      <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm"><span className="grid size-12 place-items-center rounded-full bg-blue-100 font-bold text-blue-700">{data.teacher.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><div><p className="text-xs text-slate-500">F.I.O.</p><p className="mt-1 font-bold text-slate-900">{data.teacher.name}</p></div><div className="hidden h-10 w-px bg-slate-200 sm:block" /><div><p className="flex items-center gap-1 text-xs text-slate-500"><AccountBalanceRoundedIcon sx={{ fontSize: 15 }} /> Kafedra</p><p className="mt-1 text-sm font-semibold text-slate-700">{data.teacher.departments.join(', ') || 'Ko‘rsatilmagan'}</p></div><div className="sm:ml-auto"><p className="text-xs text-slate-500">Hisob</p><p className="mt-1 text-sm text-slate-600">{data.teacher.email}</p></div></div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_330px]"><div className="overflow-hidden rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><h2 className="font-bold text-slate-900">Darslar bo‘yicha yuklama</h2><span className="text-xs text-slate-500">{rows.length} ta natija</span></div>{rows.length ? <><div className="workload-no-print overflow-x-auto">{table(displayRows, (page - 1) * limit)}</div><div className="workload-print hidden">{table(rows, 0)}</div><div className="workload-no-print mt-4"><Pagination page={page} totalPages={totalPages} total={rows.length} limit={limit} onPageChange={setPage} /></div></> : <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">{search ? 'Qidiruv bo‘yicha dars topilmadi.' : 'Tanlangan davrda sizga dars biriktirilmagan.'}</div>}</div>
        <div className="space-y-4"><section className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm"><h2 className="font-bold text-slate-900">Yuklama tarkibi</h2><div className="mt-5 flex flex-wrap items-center justify-center gap-5"><div className="grid size-36 place-items-center rounded-full" style={{ background: progress.total ? `conic-gradient(${colors.lecture} 0 ${p1}%, ${colors.practice} ${p1}% ${p2}%, ${colors.lab} ${p2}% 100%)` : '#e2e8f0' }}><div className="grid size-24 place-items-center rounded-full bg-surface text-center"><span className="text-xl font-extrabold text-slate-900">{progress.total}<small className="block text-xs font-semibold">soat</small></span></div></div><div className="space-y-2">{(['lecture', 'practice', 'lab'] as Kind[]).map((kind) => <p key={kind} className="flex items-center gap-2 text-xs font-semibold text-slate-600"><span className="size-2.5 rounded-sm" style={{ background: colors[kind] }} />{typeLabels[kind]}: {progress[kind]} soat</p>)}</div></div></section><section className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50 p-5"><h2 className="text-sm font-bold text-teal-800">Yillik umumiy yuklama</h2><p className="mt-3 text-3xl font-extrabold text-slate-900">{data.annual.total} <span className="text-lg">soat</span></p><p className="mt-2 text-xs text-teal-700">{year}–{year + 1} o‘quv yili</p></section></div>
      </div>
      <p className="text-xs leading-5 text-slate-500">Ko‘rsatkichlar biriktirilgan darslardan hisoblanadi; reja kelajakdagi darslarni ham o‘z ichiga oladi. O‘tilgan soat tugallangan yoki davomati qayd etilgan darslar bo‘yicha hisoblanadi. Talabalar soni hozirgi faol guruh tarkibi bo‘yicha olinadi. Qidiruv jadval va eksportni filtrlaydi.</p>
    </>}
  </div>
}
