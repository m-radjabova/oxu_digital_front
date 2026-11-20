import MetricCard from '../../components/ui/MetricCard'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded'
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { useMyAttendance } from '../../hooks/useMyAttendance'
import type { AttendanceStatus, StudentAttendanceRecord } from '../../types'
import PageHeading from '../../components/PageHeading'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { buttonClass } from '../../components/ui/buttonStyles'
import Card, { SectionHeader } from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton, StatSkeleton } from '../../components/ui/Skeleton'
import { UZ_MONTHS_SHORT, UZ_WEEKDAYS } from '../../utils/date'
import { periodRange } from '../../utils/periods'

type Filter = 'all' | AttendanceStatus

export default function StudentAttendancePage() {
  const { data: records, isLoading, error, refresh } = useMyAttendance()
  const [filter, setFilter] = useState<Filter>('all')

  const total = records.length
  const presentCount = records.filter((record) => record.status === 'present').length
  const absentCount = total - presentCount
  const rate = total ? Math.round((presentCount / total) * 100) : 0
  const visible = records.filter((record) => filter === 'all' || record.status === filter)
  const firstLoad = isLoading && total === 0

  return (
    <div className="mx-auto w-full max-w-[1200px] px-3 pb-5 sm:px-4 lg:px-5 lg:pb-6">
      <PageHeading
        eyebrow="Talaba kabineti"
        title="Mening davomatim"
        description="Har bir dars bo‘yicha o‘qituvchi belgilagan davomat natijalari — eng yangisi yuqorida."
        icon={<FactCheckOutlinedIcon />}
        action={
          <Badge tone={rate >= 80 ? 'success' : rate >= 60 ? 'warning' : 'danger'} dot className="h-8 px-3 text-xs">
            {total ? `${rate}% davomat` : 'Ma’lumot yo‘q'}
          </Badge>
        }
      />

      {error && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <span className="flex items-center gap-2">
            <ErrorOutlineRoundedIcon sx={{ fontSize: 18 }} />
            {error}
          </span>
          <Button variant="dangerSoft" size="sm" startIcon={<RefreshRoundedIcon sx={{ fontSize: 16 }} />} onClick={() => void refresh()}>
            Qayta urinish
          </Button>
        </div>
      )}

      {firstLoad ? (
        <HistorySkeleton />
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={<CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />} label="Jami darslar" value={total} hint="Davomat belgilangan" tone="brand" />
            <StatCard icon={<CheckCircleRoundedIcon sx={{ fontSize: 18 }} />} label="Keldi" value={presentCount} hint="Qatnashgan darslar" tone="success" />
            <StatCard icon={<CancelRoundedIcon sx={{ fontSize: 18 }} />} label="Kelmagan" value={absentCount} hint="Qatnashmagan darslar" tone="danger" />
            <div className="col-span-2 lg:col-span-1"><MetricCard icon={<CheckCircleRoundedIcon />} label="Davomat foizi" value={`${rate}%`} tone="indigo" hint={total ? `${presentCount} ta darsda qatnashgansiz` : 'Hali natijalar yo‘q'} /></div>
          </div>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-3 sm:p-4">
              <SectionHeader
                icon={<FactCheckOutlinedIcon sx={{ fontSize: 18 }} />}
                title="Davomat tarixi"
                description={total ? `${total} ta yozuv · eng yangi sanadan boshlab` : 'Natijalar paydo bo‘lgach shu yerda ko‘rinadi.'}
              />
              <div className="flex flex-wrap gap-1.5">
                <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
                  Barchasi · {total}
                </FilterChip>
                <FilterChip active={filter === 'present'} onClick={() => setFilter('present')}>
                  Keldi · {presentCount}
                </FilterChip>
                <FilterChip active={filter === 'absent'} onClick={() => setFilter('absent')}>
                  Kelmagan · {absentCount}
                </FilterChip>
              </div>
            </div>

            {visible.length ? (
              <div className="divide-y divide-slate-100 px-4 sm:px-6">
                {visible.map((record) => <AttendanceRow key={record.id} record={record} />)}
              </div>
            ) : (
              <EmptyState
                icon={<EventBusyRoundedIcon />}
                title={total ? 'Bu filtr bo‘yicha yozuv yo‘q' : 'Hali davomat natijalari yo‘q'}
                description={
                  total
                    ? 'Filtrni o‘zgartirib, boshqa natijalarni ko‘ring.'
                    : 'O‘qituvchi davomatni belgilagach, natijalar avtomatik shu yerda chiqadi.'
                }
                action={
                  total ? (
                    <Button variant="secondary" size="sm" onClick={() => setFilter('all')}>Barchasini ko‘rish</Button>
                  ) : (
                    <Link to="/student/schedule" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                      Dars jadvaliga o‘tish
                    </Link>
                  )
                }
              />
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-6">
              <p className="text-xs text-slate-500">Oxirgi 200 ta yozuv ko‘rsatiladi.</p>
              <Link to="/student/schedule" className={buttonClass({ variant: 'ghost', size: 'sm' })}>
                <ArrowBackRoundedIcon sx={{ fontSize: 16 }} />
                Dars jadvali
              </Link>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

function AttendanceRow({ record }: { record: StudentAttendanceRecord }) {
  const day = Number(record.date.slice(8, 10))
  const monthIndex = Number(record.date.slice(5, 7)) - 1
  const weekday = UZ_WEEKDAYS[new Date(`${record.date}T00:00:00`).getDay()]
  const present = record.status === 'present'
  const color = /^#[0-9a-fA-F]{6}$/.test(record.lesson.subject.color) ? record.lesson.subject.color : '#6a3ce0'

  return (
    <div className="flex flex-wrap items-center gap-3 py-3.5 sm:flex-nowrap">
      <span className="grid w-14 shrink-0 place-items-center rounded-xl bg-slate-50 py-1.5 ring-1 ring-inset ring-slate-100">
        <span className="text-lg font-extrabold leading-tight text-slate-800">{day}</span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          {UZ_MONTHS_SHORT[monthIndex]}
        </span>
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
          <strong className="truncate text-sm font-semibold text-slate-800">{record.lesson.subject.name}</strong>
          <span className="shrink-0 text-xs text-slate-300">·</span>
          <span className="truncate text-xs font-medium text-slate-500">{record.lesson.group.name}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <CalendarMonthRoundedIcon sx={{ fontSize: 13 }} className="text-slate-400" />
            {weekday.charAt(0).toUpperCase()}{weekday.slice(1)}
          </span>
          <span className="inline-flex items-center gap-1">
            <AccessTimeRoundedIcon sx={{ fontSize: 13 }} className="text-slate-400" />
            {record.lesson.period}-para · {periodRange(record.lesson.period)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MeetingRoomRoundedIcon sx={{ fontSize: 13 }} className="text-slate-400" />
            {record.lesson.room || 'Xona yo‘q'}
          </span>
        </div>
      </div>

      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold ${
          present ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
        }`}
      >
        {present ? <CheckCircleRoundedIcon sx={{ fontSize: 16 }} /> : <CancelRoundedIcon sx={{ fontSize: 16 }} />}
        {present ? 'Keldi' : 'Kelmagan'}
      </span>
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      className={`h-9 rounded-xl border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 ${
        active ? 'border-transparent bg-action-primary text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700'
      }`}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
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
  tone: 'brand' | 'success' | 'danger'
}) {
  return <MetricCard icon={icon} label={label} value={value} hint={hint} tone={({ brand: 'brand', success: 'emerald', danger: 'rose' } as const)[tone]} />
}

function HistorySkeleton() {
  return (
    <div aria-busy="true" aria-label="Davomat tarixi yuklanmoqda">
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <div className="col-span-2 lg:col-span-1"><StatSkeleton /></div>
      </div>
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-3 sm:p-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-8 w-48 rounded-lg" />
        </div>
        <div className="divide-y divide-slate-100 px-4 sm:px-6">
          {Array.from({ length: 5 }, (_, row) => (
            <div className="flex items-center gap-3 py-4" key={row}>
              <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-48 max-w-full" />
                <Skeleton className="h-2.5 w-64 max-w-full" />
              </div>
              <Skeleton className="h-7 w-24 rounded-xl" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
