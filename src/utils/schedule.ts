import type { Lesson } from '../types'
import { addDays, startOfWeek, weekdayNumber } from './date'
import { getPeriod, minutesOfDay, periodStatus, timeToMinutes } from './periods'

export const WEEK_DAYS = [
  { value: 1, label: 'Dushanba', short: 'Du' },
  { value: 2, label: 'Seshanba', short: 'Se' },
  { value: 3, label: 'Chorshanba', short: 'Ch' },
  { value: 4, label: 'Payshanba', short: 'Pa' },
  { value: 5, label: 'Juma', short: 'Ju' },
  { value: 6, label: 'Shanba', short: 'Sh' },
]

export function dayLabel(dayOfWeek: number) {
  return WEEK_DAYS.find((day) => day.value === dayOfWeek)?.label || 'Yakshanba'
}

export function sortByPeriod(lessons: Lesson[]) {
  return [...lessons].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.period - b.period)
}

export function lessonsOfDay(lessons: Lesson[], dayOfWeek: number) {
  return sortByPeriod(lessons.filter((lesson) => lesson.dayOfWeek === dayOfWeek))
}

export function countByDay(lessons: Lesson[]) {
  const counts: Record<number, number> = {}
  for (const lesson of lessons) counts[lesson.dayOfWeek] = (counts[lesson.dayOfWeek] || 0) + 1
  return counts
}

export type UpcomingLesson =
  | { kind: 'live'; lesson: Lesson; minutes: number }
  | { kind: 'today'; lesson: Lesson; minutes: number }
  | { kind: 'later'; lesson: Lesson; date: Date }

/** Joriy haftadagi hozirgi yoki eng yaqin dars */
export function findUpcomingLesson(lessons: Lesson[], now: Date): UpcomingLesson | null {
  const today = weekdayNumber(now)
  const current = minutesOfDay(now)

  for (const lesson of lessonsOfDay(lessons, today)) {
    const period = getPeriod(lesson.period)
    if (!period) continue
    const status = periodStatus(lesson.period, now)
    if (status === 'live') return { kind: 'live', lesson, minutes: timeToMinutes(period.end) - current }
    if (status === 'upcoming') return { kind: 'today', lesson, minutes: timeToMinutes(period.start) - current }
  }

  const monday = startOfWeek(now)
  for (let day = today + 1; day <= 6; day += 1) {
    const [first] = lessonsOfDay(lessons, day)
    if (first) return { kind: 'later', lesson: first, date: addDays(monday, day - 1) }
  }
  return null
}
