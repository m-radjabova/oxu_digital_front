export const HOURS_PER_CREDIT = 30
export const SEMESTER_WEEKS = 15

export type SubjectHours = {
  lecture: number
  practice: number
  lab: number
  independent: number
}

export function calculateSubjectLoad(hours: SubjectHours) {
  const totalHours = hours.lecture + hours.practice + hours.lab + hours.independent
  const classroomHours = hours.lecture + hours.practice + hours.lab
  return {
    totalHours,
    credits: totalHours / HOURS_PER_CREDIT,
    weeklyHours: classroomHours / SEMESTER_WEEKS,
  }
}

export function formatCalculatedNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)))
}
