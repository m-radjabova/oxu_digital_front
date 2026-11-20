const DAYS = [
  { value: 1, short: 'Du' },
  { value: 2, short: 'Se' },
  { value: 3, short: 'Ch' },
  { value: 4, short: 'Pa' },
  { value: 5, short: 'Ju' },
  { value: 6, short: 'Sh' },
]

/** Hafta kunlari bo‘yicha darslar soni — sodda ustunli diagramma */
export default function WeekBars({
  counts,
  today,
  height = 140,
}: {
  counts: Record<number, number>
  today?: number
  height?: number
}) {
  const max = Math.max(1, ...DAYS.map((day) => counts[day.value] || 0))

  return (
    <div className="flex items-end justify-between gap-2 sm:gap-3" style={{ height: height + 44 }} role="img" aria-label="Hafta kunlari bo‘yicha darslar soni">
      {DAYS.map((day, index) => {
        const count = counts[day.value] || 0
        const isToday = day.value === today
        const barHeight = count ? Math.max(10, Math.round((count / max) * height)) : 6
        return (
          <div key={day.value} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className={`text-xs font-bold ${isToday ? 'text-brand-700' : 'text-slate-500'}`}>{count}</span>
            <div className="flex w-full justify-center" style={{ height }}>
              <div className="flex w-full max-w-11 items-end">
                <span
                  className={`block w-full origin-bottom rounded-xl transition-all duration-700 ease-out animate-slide-up ${
                    isToday
                      ? 'bg-gradient-to-t from-brand-600 to-indigo-400 shadow-glow'
                      : count
                        ? 'bg-gradient-to-t from-brand-200 to-brand-100'
                        : 'bg-slate-100'
                  }`}
                  style={{ height: barHeight, animationDelay: `${index * 60}ms` }}
                />
              </div>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                isToday ? 'bg-brand-600 text-white' : 'text-slate-400'
              }`}
            >
              {day.short}
            </span>
          </div>
        )
      })}
    </div>
  )
}
