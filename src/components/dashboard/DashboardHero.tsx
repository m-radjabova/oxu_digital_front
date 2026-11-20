import type { ReactNode } from 'react'
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded'
import CampusIllustration from '../CampusIllustration'
import { formatWeekdayDate, greeting } from '../../utils/date'

/**
 * Hero sidebar bilan bir xil fonda va kontent kengligini to'liq egallaydi:
 * `main` konteyner (@container) bo'lgani uchun sahifa paddinglaridan cqw orqali chiqadi.
 * Sahifa o'ramining yuqori paddingi bo'lmasligi kerak.
 */
export default function DashboardHero({
  name,
  now,
  subtitle,
  badge,
  actions,
  aside,
}: {
  name: string
  now: Date
  subtitle: string
  badge?: ReactNode
  actions?: ReactNode
  aside?: ReactNode
}) {
  const firstName = name.trim().split(/\s+/)[0] || name

  return (
    <section className="theme-fixed relative isolate mx-[calc(50%_-_50cqw)] overflow-hidden bg-gradient-to-b from-[#2a2559] via-[#28235a] to-[#1d1a47] text-white">
      {/* Fon: sidebardagi kabi nur dog'lari, nuqtali to'r va universitet binosi */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute -left-24 -top-32 size-80 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="absolute -bottom-40 right-[10%] size-96 rounded-full bg-indigo-400/15 blur-3xl" />
        <div className="absolute left-1/3 top-0 h-40 w-[40%] rounded-full bg-fuchsia-400/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent_90%)]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        />
        <div className="absolute bottom-0 right-0 aspect-[272/176] h-[70%] translate-x-[18%] text-violet-200 opacity-[0.14] lg:right-auto lg:left-[52%] lg:h-[96%] lg:-translate-x-1/2 lg:opacity-[0.24]">
          <CampusIllustration bg="#221f4f" />
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1500px] gap-6 px-4 py-7 sm:px-6 sm:py-9 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:items-center lg:px-10 lg:py-11">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-indigo-50 backdrop-blur">
              <CalendarTodayRoundedIcon sx={{ fontSize: 13 }} />
              {formatWeekdayDate(now, { year: true })}
            </span>
            {badge}
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-[2.25rem]">
            {greeting(now)}, <span className="text-violet-200">{firstName}</span>! <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100/75 sm:text-[15px]">{subtitle}</p>
          {actions && <div className="mt-6 flex flex-wrap gap-2">{actions}</div>}
        </div>
        {aside && <div className="min-w-0">{aside}</div>}
      </div>
    </section>
  )
}
