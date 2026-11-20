import { useCallback } from 'react'
import useApiResource from './useApiResource'
import { api } from '../lib/api'
import type { User } from '../types'

export function useUsers(role?: 'teacher' | 'student', enabled = true) {
  const path = role ? `/users?role=${role}` : '/users'
  const { data, isLoading, error, refresh } = useApiResource<User>(path, enabled)

  const createUser = useCallback(async (values: {
    name: string
    email: string
    password: string
    role: 'teacher' | 'student'
    groupId?: string
  }) => {
    const user = await api<User>('/users', { method: 'POST', body: JSON.stringify(values) })
    await refresh()
    return user
  }, [refresh])

  return { data, isLoading, error, refresh, createUser }
}
