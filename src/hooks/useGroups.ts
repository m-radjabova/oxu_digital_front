import { useCallback } from 'react'
import useApiResource from './useApiResource'
import { api } from '../lib/api'
import type { Group } from '../types'

export function useGroups(enabled = true) {
  const { data, isLoading, error, refresh } = useApiResource<Group>('/groups', enabled)

  const createGroup = useCallback(async (values: { name: string; year: number; directionId: string }) => {
    const group = await api<Group>('/groups', { method: 'POST', body: JSON.stringify(values) })
    await refresh()
    return group
  }, [refresh])

  const updateGroup = useCallback(async (groupId: string, values: { name: string; year: number; directionId: string }) => {
    const group = await api<Group>(`/groups/${groupId}`, { method: 'PUT', body: JSON.stringify(values) })
    await refresh()
    return group
  }, [refresh])

  const setGroupActive = useCallback(async (groupId: string, isActive: boolean) => {
    const group = await api<Group>(`/groups/${groupId}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) })
    await refresh()
    return group
  }, [refresh])

  const addGroupSubjects = useCallback(async (groupId: string, subjectIds: string[]) => {
    await api(`/groups/${groupId}/subjects`, { method: 'POST', body: JSON.stringify({ subjectIds }) })
  }, [])

  return { data, isLoading, error, refresh, createGroup, updateGroup, setGroupActive, addGroupSubjects }
}
