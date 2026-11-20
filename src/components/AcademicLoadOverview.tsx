import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { api } from '../lib/api'
import { subscribeToRealtime } from '../lib/realtime'
import { useAcademicStructure } from '../hooks/useAcademicStructure'
import { useGroups } from '../hooks/useGroups'
import Pagination from './Pagination'
import Card, { SectionHeader } from './ui/Card'
import Button from './ui/Button'
import FilterSelect from './ui/FilterSelect'
import { inputClass } from './ui/fieldStyles'

type LoadType = { type: 'lecture' | 'practice' | 'lab'; allocated: number; planned: number; completed: number; remaining: number }
type LoadStatus = 'remaining' | 'full' | 'missing' | 'over'
type LoadRow = { subjectId: string; subject: string; code: string; direction: string; groupId: string; group: string; groupActive: boolean; types: LoadType[]; loadStatus: LoadStatus; allocated: number; planned: number; remaining: number }
type LoadResponse = { items: LoadRow[]; page: number; limit: number; total: number; totalPages: number; counts: Record<LoadStatus, number> }
const labels: Record<LoadType['type'], string> = { lecture: 'Ma’ruza', practice: 'Amaliyot', lab: 'Laboratoriya' }
const statusInfo: Record<LoadStatus, { label: string; color: string }> = {
  remaining: { label: 'Soat qolgan', color: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  full: { label: 'Para uchun soat yetmaydi', color: 'bg-violet-50 text-violet-700 ring-violet-200' },
  missing: { label: 'Soat ajratilmagan', color: 'bg-slate-100 text-slate-600 ring-slate-200' },
  over: { label: 'Limitdan oshgan', color: 'bg-rose-50 text-rose-700 ring-rose-200' },
}

export default function AcademicLoadOverview() {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query.trim())
  const [directionId, setDirectionId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState<{ key: string; data?: LoadResponse; error?: string } | null>(null)
  const { directions } = useAcademicStructure()
  const { data: groups } = useGroups()
  const refresh = useCallback(() => setVersion((value) => value + 1), [])
  const params = useMemo(() => {
    const values = new URLSearchParams({ page: String(page), limit: String(limit), status, type })
    if (deferredQuery) values.set('q', deferredQuery)
    if (directionId) values.set('directionId', directionId)
    if (groupId) values.set('groupId', groupId)
    return values.toString()
  }, [page, limit, status, type, deferredQuery, directionId, groupId])
  const requestKey = `${params}:${version}`
  useEffect(() => {
    let active = true
    api<LoadResponse>(`/subjects/load-overview?${params}`, { dedupe: false }).then((data) => {
      if (active) {
        if (data.page > data.totalPages) { setPage(data.totalPages); return }
        setResult({ key: requestKey, data })
      }
    }).catch((reason) => {
      if (active) setResult({ key: requestKey, error: reason instanceof Error ? reason.message : 'Yuklamalarni yuklab bo‘lmadi.' })
    })
    return () => { active = false }
  }, [params, requestKey])
  useEffect(() => subscribeToRealtime((event) => {
    if (event.type === 'lessons:changed' || event.type === 'reconnected') refresh()
  }), [refresh])
  const loading = result?.key !== requestKey || query.trim() !== deferredQuery
  const data = result?.key === requestKey ? result.data : undefined
  const error = result?.key === requestKey ? result.error : undefined
  const eligibleGroups = groups.filter((group) => !directionId || group.direction?.id === directionId)
  const activeFilters = Boolean(query || directionId || groupId || status !== 'all' || type !== 'all')
  function resetFilters() { setQuery(''); setDirectionId(''); setGroupId(''); setStatus('all'); setType('all'); setPage(1) }

  return <div className="space-y-4">
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-4 sm:p-5">
        <SectionHeader icon={<AccessTimeRoundedIcon sx={{ fontSize: 19 }} />} title="Yuklamalarni kuzatish" description="Har bir fan va guruh bo‘yicha reja va qolgan soatlarni tekshiring." />
        <Button variant="secondary" size="sm" startIcon={<RefreshRoundedIcon sx={{ fontSize: 16 }} />} onClick={refresh}>Yangilash</Button>
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        <div className="relative"><SearchRoundedIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" sx={{ fontSize: 20 }} /><input aria-label="Fan yoki guruhni qidirish" className={`${inputClass} h-11 pl-10`} placeholder="Fan, kod, guruh yoki yo‘nalishni qidiring" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} /></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FilterSelect aria-label="Yo‘nalish" value={directionId} onChange={(event) => { setDirectionId(event.target.value); setGroupId(''); setPage(1) }}><option value="">Barcha yo‘nalishlar</option>{directions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</FilterSelect>
          <FilterSelect aria-label="Guruh" value={groupId} onChange={(event) => { setGroupId(event.target.value); setPage(1) }}><option value="">Barcha guruhlar</option>{eligibleGroups.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</FilterSelect>
          <FilterSelect aria-label="Mashg‘ulot turi" value={type} onChange={(event) => { setType(event.target.value); setPage(1) }}><option value="all">Barcha mashg‘ulotlar</option><option value="lecture">Ma’ruza</option><option value="practice">Amaliyot</option><option value="lab">Laboratoriya</option></FilterSelect>
          <FilterSelect aria-label="Yuklama holati" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}><option value="all">Barcha holatlar</option><option value="remaining">Soat qolgan</option><option value="full">Para uchun soat qolmagan</option><option value="missing">Soat ajratilmagan</option><option value="over">Limitdan oshgan</option></FilterSelect>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>1 para = 2 akademik soat. Rejalashtirilgan soatlarga o‘tilgan darslar ham kiradi.</span>{activeFilters && <button type="button" onClick={resetFilters} className="font-bold text-brand-700 hover:underline">Filtrlarni tozalash</button>}</div>
      </div>
    </Card>
    {data && !loading && <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Tanlangan natijalar bo‘yicha yuklama holati">{([
      ['remaining', 'Soat qolgan'], ['full', 'Para uchun soat qolmagan'], ['over', 'Limitdan oshgan'], ['missing', 'Soat ajratilmagan'],
    ] as const).map(([key, label]) => <div key={key} className="rounded-2xl border border-slate-200 bg-surface px-4 py-3 shadow-sm"><span className="block text-xs font-medium text-slate-500">{label}</span><strong className="mt-1 block text-xl text-slate-800">{data.counts[key]}</strong></div>)}</div>}
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:px-5"><div><h2 className="text-base font-bold text-slate-900">Fan va guruhlar</h2><p className="mt-1 text-xs text-slate-500">{data ? `${data.total} ta natija` : 'Yuklama ma’lumotlari'}</p></div><label className="flex items-center gap-2 text-xs font-medium text-slate-500">Sahifada <select className="rounded-lg border border-slate-200 bg-surface px-2 py-1.5 text-slate-700" value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1) }}><option value={10}>10 ta</option><option value={20}>20 ta</option><option value={50}>50 ta</option></select></label></div>
      {loading ? <p role="status" className="p-6 text-sm text-slate-500">Yuklanmoqda...</p> : error ? <div role="alert" className="m-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error} <button type="button" className="font-bold underline" onClick={refresh}>Qayta urinish</button></div> : !data?.items.length ? <div className="p-8 text-center"><p className="font-semibold text-slate-700">Yuklama topilmadi</p><p className="mt-1 text-sm text-slate-500">{activeFilters ? 'Filtrlarni o‘zgartiring yoki tozalang.' : 'Fanlarga guruh biriktirilgandan so‘ng yuklamalar shu yerda ko‘rinadi.'}</p></div> : <div className="divide-y divide-slate-100">{data.items.map((row) => {
        const percentage = row.allocated > 0 ? Math.min(100, Math.round(row.planned / row.allocated * 100)) : 0
        const state = statusInfo[row.loadStatus]
        return <article key={`${row.subjectId}-${row.groupId}`} className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{row.subject} <span className="text-xs font-medium text-slate-400">{row.code}</span></h3><p className="mt-1 text-xs text-slate-500"><span className="font-semibold text-slate-700">{row.group}</span>{!row.groupActive && ' · nofaol'} · {row.direction}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${state.color}`}>{state.label}</span></div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs"><span className="font-semibold text-slate-600">Reja: {row.planned} / {row.allocated} soat</span><span className="font-semibold text-slate-500">Qoldi: {row.remaining} soat</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${row.subject}, ${row.group} yuklamasi`} aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}><div className={`h-full rounded-full ${row.loadStatus === 'over' ? 'bg-rose-500' : 'bg-brand-500'}`} style={{ width: `${percentage}%` }} /></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">{row.types.map((item) => <div key={item.type} className="rounded-xl bg-slate-50 px-3 py-2.5"><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-slate-700">{labels[item.type]}</span><span className={`text-xs font-semibold ${item.planned > item.allocated ? 'text-rose-700' : 'text-slate-600'}`}>{item.planned} / {item.allocated}</span></div><p className="mt-1 text-[11px] text-slate-500">{item.allocated === 0 && item.planned === 0 ? 'Soat ajratilmagan' : item.planned > item.allocated ? `Limitdan ${item.planned - item.allocated} soat ortiq` : `Qoldi: ${item.remaining} soat · O‘tilgan: ${item.completed} soat`}</p></div>)}</div>
        </article>
      })}</div>}
      {data && !loading && data.total > 0 && <div className="border-t border-slate-100 p-4 sm:px-5"><Pagination page={page} totalPages={data.totalPages} total={data.total} limit={limit} onPageChange={setPage} /></div>}
    </Card>
    <p className="px-1 text-xs leading-5 text-slate-500">O‘tilgan soatlar darsning tugallangan holati bo‘yicha ko‘rsatiladi. Mustaqil ta’lim jadval yuklamasiga kirmaydi. Holatlar tanlangan filtrlar bo‘yicha hisoblanadi.</p>
  </div>
}
