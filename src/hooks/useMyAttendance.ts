import useApiResource from './useApiResource'
import type { StudentAttendanceRecord } from '../types'

export function useMyAttendance(enabled = true) {
  return useApiResource<StudentAttendanceRecord>('/attendance/me', enabled)
}
