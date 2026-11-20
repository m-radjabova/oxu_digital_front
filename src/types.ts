export type Role = 'admin' | 'teacher' | 'student'

export interface Group {
  id: string
  name: string
  year: number
  isActive?: boolean
  educationForm?: 'full-time' | 'evening' | 'part-time'
  admissionYear?: number
  studentLimit?: number
  studentCount?: number
  direction?: Direction | null
}

export interface Faculty {
  id: string
  name: string
  isActive: boolean
  departmentCount?: number
  directionCount?: number
  groupCount?: number
  studentCount?: number
}

export interface Department {
  id: string
  name: string
  faculty: Pick<Faculty, 'id' | 'name'>
  isActive: boolean
  directionCount?: number
  groupCount?: number
  studentCount?: number
}

export interface Direction {
  id: string
  name: string
  department: Department
  isActive: boolean
  groupCount?: number
  studentCount?: number
}

export interface AcademicStructureData {
  faculties: Faculty[]
  departments: Department[]
  directions: Direction[]
}

export interface Subject {
  id: string
  name: string
  color: string
  code?: string
  description?: string
  direction?: Pick<Direction, 'id' | 'name'> | null
  course?: number | null
  semester?: number | null
  educationForm?: 'full-time' | 'evening'
  block?: 'mandatory' | 'elective'
  subjectType?: 'theory' | 'theory-practice' | 'practice'
  ratingType?: '100-point' | 'credit'
  credits?: number
  hours?: { lecture: number; practice: number; lab: number; independent: number }
  groups?: Pick<Group, 'id' | 'name' | 'year' | 'isActive'>[]
}

export type RoomKind = 'lecture' | 'classroom' | 'laboratory' | 'multi'

export interface RoomLessonSummary {
  id: string
  type: LessonType
  subject: string
  teacher: string
  groups: string[]
}

export interface Room {
  id: string
  buildingId: string
  number: string
  floor: number | null
  capacity: number
  kind: RoomKind
  isActive: boolean
  occupied: boolean
  lesson: RoomLessonSummary | null
}

export interface Building {
  id: string
  name: string
  address: string
  isActive: boolean
  rooms: Room[]
}

export interface LessonRoom {
  id: string
  number: string
  kind: RoomKind
  building: Pick<Building, 'id' | 'name'>
}

export interface User {
  id: string
  name: string
  email: string
  role: Role
  group: Group | null
  isActive: boolean
  subjectIds?: string[]
  directionIds?: string[]
}

export type LessonType = 'lecture' | 'practice' | 'lab'

export interface Lesson {
  id: string
  groups: Pick<Group, 'id' | 'name'>[]
  type: LessonType
  subject: Subject
  teacher: Pick<User, 'id' | 'name' | 'email'>
  dayOfWeek: number
  period: number
  weekStart: string
  room: string
  roomId?: LessonRoom | null
  durationMinutes?: number
  academicHours?: number
  status?: 'planned' | 'completed' | 'cancelled'
}

export interface TeacherAvailability {
  id: string
  teacher: Pick<User, 'id' | 'name' | 'email'>
  dayOfWeek: number
  period: number
  weekStart: string
}

export type AttendanceStatus = 'present' | 'absent'

export interface AttendanceRecordStatus {
  lessonId: string
}

export interface AttendanceDetails {
  lesson: Pick<Lesson, 'id' | 'dayOfWeek' | 'period' | 'room' | 'type'> & {
    groups: Pick<Group, 'id' | 'name'>[]
    subject: Pick<Subject, 'id' | 'name'>
  }
  date: string
  students: (Pick<User, 'id' | 'name' | 'email'> & { group?: Pick<Group, 'id' | 'name'> | null })[]
  previousAttendance?: { entries: { student: Pick<User, 'id' | 'name' | 'email'> | null; status: AttendanceStatus }[] } | null
  attendance: {
    id: string
    takenAt: string
    note?: string
    entries: { student: Pick<User, 'id' | 'name' | 'email'> | null; status: AttendanceStatus }[]
  } | null
}

export interface StudentAttendanceRecord {
  id: string
  date: string
  takenAt: string
  status: AttendanceStatus
  lesson: {
    id: string
    dayOfWeek: number
    period: number
    room: string
    group: { name: string }
    subject: { name: string; color: string }
  }
}
