export interface Period {
  number: number
  start: string
  end: string
}

export const PERIODS: Period[] = [
  { number: 1, start: '08:30', end: '09:50' },
  { number: 2, start: '10:00', end: '11:20' },
  { number: 3, start: '11:30', end: '12:50' },
  { number: 4, start: '13:30', end: '14:50' },
  { number: 5, start: '15:00', end: '16:20' },
  { number: 6, start: '16:30', end: '17:50' },
  { number: 7, start: '18:00', end: '19:20' },
  { number: 8, start: '19:30', end: '20:50' },
]

export function getPeriod(number: number) {
  return PERIODS.find((period) => period.number === number)
}

export function periodRange(number: number) {
  const period = getPeriod(number)
  return period ? `${period.start} — ${period.end}` : ''
}

export type LessonTimeStatus = 'live' | 'done' | 'upcoming'

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function minutesOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes()
}

/** Bugungi para hozir davom etyaptimi, tugaganmi yoki hali boshlanmaganmi */
export function periodStatus(number: number, now: Date): LessonTimeStatus {
  const period = getPeriod(number)
  if (!period) return 'upcoming'
  const current = minutesOfDay(now)
  if (current >= timeToMinutes(period.end)) return 'done'
  if (current >= timeToMinutes(period.start)) return 'live'
  return 'upcoming'
}

/** "25 daqiqa" yoki "1 soat 10 daqiqa" */
export function formatDuration(totalMinutes: number) {
  const minutes = Math.max(0, Math.round(totalMinutes))
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest} daqiqa`
  return rest ? `${hours} soat ${rest} daqiqa` : `${hours} soat`
}
