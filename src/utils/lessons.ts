import type { Lesson, LessonType } from '../types'

export const LESSON_TYPES: { value: LessonType; label: string; short: string; hint: string }[] = [
  { value: 'lecture', label: 'Ma’ruza', short: 'M', hint: 'Bir nechta guruh birlashadi' },
  { value: 'practice', label: 'Amaliyot', short: 'A', hint: 'Bitta guruh' },
  { value: 'lab', label: 'Laboratoriya', short: 'L', hint: 'Bitta guruh' },
]

export const MAX_LECTURE_GROUPS = 6

export function lessonTypeLabel(type?: LessonType) {
  return LESSON_TYPES.find((item) => item.value === type)?.label || 'Dars'
}

export function lessonTypeShort(type?: LessonType) {
  return LESSON_TYPES.find((item) => item.value === type)?.short || '—'
}

// Ma’ruzada guruhlar bir nechta bo‘lishi mumkin — kartada nomlar vergul bilan chiqadi.
export function lessonGroupNames(lesson?: Pick<Lesson, 'groups'> | null) {
  const names = (lesson?.groups || []).map((group) => group.name).filter(Boolean)
  return names.length ? names.join(', ') : 'Guruh belgilanmagan'
}

export function normalizeRoomName(room: string) {
  return room.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function lessonsWithRoomsAtSlot(
  lessons: Lesson[],
  { weekStart, dayOfWeek, period }: { weekStart: string; dayOfWeek: number; period: number },
) {
  return lessons.filter((lesson) =>
    lesson.weekStart === weekStart
    && lesson.dayOfWeek === dayOfWeek
    && lesson.period === period
    && Boolean(normalizeRoomName(lesson.room)),
  )
}

// Shu parada boshqa darsga biriktirilgan guruhlar — ularni qayta tanlab bo‘lmaydi.
export function busyGroupIdsAtSlot(
  lessons: Lesson[],
  { dayOfWeek, period, excludeLessonId }: { dayOfWeek: number; period: number; excludeLessonId?: string },
) {
  const busy = new Map<string, string>()
  for (const lesson of lessons) {
    if (lesson.id === excludeLessonId) continue
    if (lesson.dayOfWeek !== dayOfWeek || lesson.period !== period) continue
    for (const group of lesson.groups) {
      busy.set(group.id, `${group.name} bu parada ${lesson.subject.name} darsiga biriktirilgan`)
    }
  }
  return busy
}
