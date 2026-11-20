import useApiResource from './useApiResource'
import type { AttendanceRecordStatus } from '../types'

export function useAttendanceStatuses(date: string, enabled = true) {
  return useApiResource<AttendanceRecordStatus>(`/attendance?date=${encodeURIComponent(date)}`, enabled)
}
