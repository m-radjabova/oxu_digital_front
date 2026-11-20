import { useMemo, useState } from 'react'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import { useLessons } from '../../hooks/useLessons'
import { useTeacherAvailability } from '../../hooks/useTeacherAvailability'
import useToast from '../../hooks/useToast'
import { addDays, formatDate, formatWeekRange, startOfWeek, toDateKey } from '../../utils/date'
import { PERIODS } from '../../utils/periods'
import PageHeading from '../../components/PageHeading'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'

const DAYS = [
  { value: 1, label: 'Dushanba' },
  { value: 2, label: 'Seshanba' },
  { value: 3, label: 'Chorshanba' },
  { value: 4, label: 'Payshanba' },
  { value: 5, label: 'Juma' },
  { value: 6, label: 'Shanba' },
]

export default function AvailabilityPage() {
  const toast = useToast()
  const [monday, setMonday] = useState(() => startOfWeek(new Date()))
  const weekStart = toDateKey(monday)
  const {
    data: lessons,
    isLoading: lessonsLoading,
    error: lessonsError,
  } = useLessons(true, { weekStart })
  const {
    data: busySlots,
    isLoading: availabilityLoading,
    error: availabilityError,
    refresh,
    addBusySlot,
    removeBusySlot,
  } = useTeacherAvailability(true, { weekStart })
  const [mutatingSlot, setMutatingSlot] = useState('')

  const lessonsBySlot = useMemo(
    () => new Map(lessons.map((lesson) => [`${lesson.dayOfWeek}:${lesson.period}`, lesson])),
    [lessons],
  )
  const busyBySlot = useMemo(
    () => new Map(busySlots.map((slot) => [`${slot.dayOfWeek}:${slot.period}`, slot])),
    [busySlots],
  )
  const loadError = lessonsError || availabilityError
  const isLoading = lessonsLoading || availabilityLoading

  function moveWeek(amount: number) {
    setMonday((current) => {
      const next = new Date(current)
      next.setDate(next.getDate() + amount * 7)
      return next
    })
  }

  async function toggleBusy(dayOfWeek: number, period: number) {
    const key = `${dayOfWeek}:${period}`
    const currentSlot = busyBySlot.get(key)
    setMutatingSlot(key)
    try {
      if (currentSlot) {
        await removeBusySlot(currentSlot.id)
        toast.success('Para band vaqtlardan olib tashlandi.')
      } else {
        await addBusySlot({ dayOfWeek, period, weekStart })
        toast.success('Para band vaqt sifatida saqlandi.')
      }
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Band vaqtni saqlab bo‘lmadi.')
    } finally {
      setMutatingSlot('')
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-3 pb-5 sm:px-4 lg:px-5 lg:pb-6">
      <PageHeading
        eyebrow="O‘qituvchi kabineti"
        title="Band vaqtlarim"
        description="Darsingiz bor kataklar band qilinmaydi. Bo‘sh katakni bosib, ishlay olmaydigan paralarni belgilang — ular administrator jadvalida sariq ko‘rinadi."
        icon={<EventBusyRoundedIcon />}
      />

      {loadError && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <span className="flex items-center gap-2">
            <ErrorOutlineRoundedIcon sx={{ fontSize: 18 }} />
            {loadError}
          </span>
          <Button variant="dangerSoft" size="sm" onClick={() => void refresh()}>
            Qayta urinish
          </Button>
        </div>
      )}

      <Card className="mb-5 flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
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
            Joriy hafta
          </Button>
        </div>
        <p className="text-sm font-bold text-slate-800">
          {formatWeekRange(monday, addDays(monday, 5))}
          {isLoading && <span className="ml-2 text-xs font-medium text-brand-600">yangilanmoqda…</span>}
        </p>
        <span className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          <span className="size-3 rounded-sm bg-amber-300 ring-1 ring-amber-400" />
          Band qilib belgilangan
        </span>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="grid gap-2 p-4" aria-label="Band vaqtlar yuklanmoqda" aria-busy="true">
            {Array.from({ length: 6 }, (_, index) => <Skeleton className="h-12 w-full rounded-lg" key={index} />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-center">
              <thead>
                <tr className="bg-slate-50">
                  <th className="sticky left-0 z-[1] min-w-36 border-b border-r border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-bold text-slate-600">
                    Hafta kuni
                  </th>
                  {PERIODS.map(({ number, start }) => (
                    <th key={number} className="min-w-24 border-b border-r border-slate-200 px-2 py-3 last:border-r-0">
                      <span className="block text-xs font-bold text-slate-700">{number}-para</span>
                      <span className="mt-1 block text-[10px] font-medium text-slate-400">{start}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day) => (
                  <tr key={day.value} className="border-b border-slate-100 last:border-b-0">
                    <th className="sticky left-0 z-[1] border-r border-slate-200 bg-surface px-4 py-2 text-left text-xs font-semibold text-slate-700">
                      <span className="block">{day.label}</span>
                      <span className="mt-0.5 block text-[10px] font-normal text-slate-400">
                        {formatDate(addDays(monday, day.value - 1), { month: 'short' })}
                      </span>
                    </th>
                    {PERIODS.map(({ number }) => {
                      const key = `${day.value}:${number}`
                      const lesson = lessonsBySlot.get(key)
                      const busySlot = busyBySlot.get(key)
                      const isMutating = mutatingSlot === key
                      return (
                        <td key={number} className="border-r border-slate-100 p-1 last:border-r-0">
                          <button
                            type="button"
                            onClick={() => void toggleBusy(day.value, number)}
                            disabled={Boolean(lesson) || Boolean(mutatingSlot)}
                            title={
                              lesson
                                ? `${lesson.period}-para: ${lesson.subject.name} darsi bor`
                                : busySlot
                                  ? 'Band vaqtni bekor qilish'
                                  : 'Parani band vaqt sifatida belgilash'
                            }
                            className={`h-10 w-full rounded-lg border text-[11px] font-bold transition disabled:cursor-not-allowed ${
                              lesson
                                ? 'border-slate-200 bg-slate-100 text-slate-400'
                                : busySlot
                                  ? 'border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200'
                                  : 'border-slate-200 bg-surface text-slate-400 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800'
                            }`}
                          >
                            {isMutating ? '…' : lesson ? 'DARS' : busySlot ? 'BAND' : 'Bo‘sh'}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs leading-5 text-slate-500">
          Sariq katakni qayta bosing — bandlik bekor qilinadi. Dars bor kataklarni belgilab bo‘lmaydi.
        </p>
      </Card>
    </div>
  )
}
