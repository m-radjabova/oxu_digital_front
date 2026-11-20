import { useCallback } from 'react'
import useApiResource from './useApiResource'
import { api } from '../lib/api'
import type { Subject } from '../types'

export function useSubjects(enabled = true) {
  const { data, isLoading, error, refresh } = useApiResource<Subject>('/subjects', enabled)

  const createSubject = useCallback(async (values: Record<string, unknown> & { name: string; color: string }) => {
    const subject = await api<Subject>('/subjects', { method: 'POST', body: JSON.stringify(values) })
    await refresh()
    return subject
  }, [refresh])

  const updateSubjectGroups = useCallback(async (subjectId: string, groupIds: string[]) => {
    const subject = await api<Subject>(`/subjects/${subjectId}/groups`, { method: 'PATCH', body: JSON.stringify({ groupIds }) })
    await refresh()
    return subject
  }, [refresh])

  const updateSubject = useCallback(async (subjectId: string, values: Record<string, unknown> & { name: string; color: string }) => {
    const subject = await api<Subject>(`/subjects/${subjectId}`, { method: 'PUT', body: JSON.stringify(values) })
    await refresh()
    return subject
  }, [refresh])

  const deleteSubject = useCallback(async (subjectId: string) => {
    await api(`/subjects/${subjectId}`, { method: 'DELETE' })
    await refresh()
  }, [refresh])

  return { data, isLoading, error, refresh, createSubject, updateSubject, deleteSubject, updateSubjectGroups }
}
