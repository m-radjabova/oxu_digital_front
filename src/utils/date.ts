export const UZ_MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
]

export const UZ_MONTHS_SHORT = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek']

export const UZ_WEEKDAYS = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba']

type DateInput = Date | string

function toDate(value: DateInput) {
  if (value instanceof Date) return new Date(value.getTime())
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value)
}

/** 16-noyabr yoki 16-noy, 2026 */
export function formatDate(
  value: DateInput,
  options: { month?: 'long' | 'short'; year?: boolean } = {},
) {
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) return '—'
  const names = options.month === 'short' ? UZ_MONTHS_SHORT : UZ_MONTHS
  const label = `${date.getDate()}-${names[date.getMonth()]}`
  return options.year ? `${label}, ${date.getFullYear()}` : label
}

/** Payshanba, 16-noyabr, 2026 */
export function formatWeekdayDate(value: DateInput, options: { year?: boolean } = {}) {
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) return '—'
  const weekday = UZ_WEEKDAYS[date.getDay()]
  const label = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}`
  return `${label}, ${formatDate(date, { year: options.year })}`
}

/** 15:08 */
export function formatTime(value: DateInput) {
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) return '—'
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

/** 16-noyabr, 2026 · 15:08 */
export function formatDateTime(value: DateInput, options: { year?: boolean } = {}) {
  return `${formatDate(value, { year: options.year })} · ${formatTime(value)}`
}

/** 16 — 21-noyabr, 2026 (oylar farq qilsa: 30-noyabr — 5-dekabr, 2026) */
export function formatWeekRange(start: DateInput, end: DateInput) {
  const from = toDate(start)
  const to = toDate(end)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return '—'
  if (from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()) {
    return `${from.getDate()} — ${to.getDate()}-${UZ_MONTHS[to.getMonth()]}, ${to.getFullYear()}`
  }
  return `${formatDate(from)} — ${formatDate(to, { year: true })}`
}

/** 2026-11-12 — server bilan ishlatiladigan sana kaliti */
export function toDateKey(value: DateInput = new Date()) {
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function getTodayDateKey() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`
}

/** Tanlangan kunning dushanbasi */
export function startOfWeek(value: DateInput = new Date()) {
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) return new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  return date
}

export function addDays(value: DateInput, amount: number) {
  const date = toDate(value)
  date.setDate(date.getDate() + amount)
  return date
}

/** Dushanba = 1 … Yakshanba = 7 */
export function weekdayNumber(value: DateInput = new Date()) {
  const date = toDate(value)
  return ((date.getDay() + 6) % 7) + 1
}

export function greeting(value: Date = new Date()) {
  const hour = value.getHours()
  if (hour < 5) return 'Xayrli tun'
  if (hour < 12) return 'Xayrli tong'
  if (hour < 18) return 'Xayrli kun'
  return 'Xayrli kech'
}

/** Toshkent vaqtidagi taqvim va soatni qurilma vaqt zonasidan qat’i nazar ishlatish. */
export function tashkentWallTime(value: Date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(value)
  const fields = Object.fromEntries(parts.map(({ type, value: part }) => [type, Number(part)]))
  return new Date(fields.year, fields.month - 1, fields.day, fields.hour, fields.minute, fields.second)
}
