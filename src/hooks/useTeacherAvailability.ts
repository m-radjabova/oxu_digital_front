import { useCallback } from 'react'
import useApiResource from './useApiResource'
import { api } from '../lib/api'
import type { TeacherAvailability } from '../types'

export interface TeacherAvailabilityInput {
  dayOfWeek: number
  period: number
  weekStart: string
}

export interface TeacherAvailabilityQuery {
  teacherIds?: string
  weekStart?: string
}

export function useTeacherAvailability(enabled = true, query: TeacherAvailabilityQuery = {}) {
  const params = new URLSearchParams()
  if (query.weekStart) params.set('weekStart', query.weekStart)
  if (query.teacherIds) params.set('teacherIds', query.teacherIds)
  const search = params.toString()
  const path = search ? `/teacher-availability?${search}` : '/teacher-availability'
  const { data, isLoading, error, refresh } = useApiResource<TeacherAvailability>(path, enabled)

  const addBusySlot = useCallback(async (values: TeacherAvailabilityInput) => {
    const slot = await api<TeacherAvailability>('/teacher-availability', {
      method: 'POST',
      body: JSON.stringify(values),
    })
    await refresh()
    return slot
  }, [refresh])

  const removeBusySlot = useCallback(async (slotId: string) => {
    await api(`/teacher-availability/${slotId}`, { method: 'DELETE' })
    await refresh()
  }, [refresh])

  return { data, isLoading, error, refresh, addBusySlot, removeBusySlot }
}
