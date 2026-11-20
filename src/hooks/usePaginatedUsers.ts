import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { User } from '../types'

export const PAGE_SIZE = 15

export interface PageResult<T> {
  items: T[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface UserCounts {
  total: number
  teachers: number
  students: number
  inactive: number
}

export interface UserPageResult extends PageResult<User> {
  counts?: UserCounts
}

export interface UserInput {
  name: string
  email: string
  password: string
  role: 'teacher' | 'student'
  groupId?: string
  subjectIds?: string[]
  directionIds?: string[]
}

export interface UserUpdateInput {
  name: string
  email: string
  role: 'teacher' | 'student'
  groupId?: string
  password?: string
  subjectIds?: string[]
  directionIds?: string[]
}

const EMPTY_PAGE: UserPageResult = { items: [], page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 }

export function usePaginatedUsers(
  role: 'teacher' | 'student' | undefined,
  page: number,
  filters: { facultyId?: string; departmentId?: string; directionId?: string; search?: string } = {},
) {
  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
  if (role) params.set('role', role)
  if (filters.facultyId) params.set('facultyId', filters.facultyId)
  if (filters.departmentId) params.set('departmentId', filters.departmentId)
  if (filters.directionId) params.set('directionId', filters.directionId)
  if (filters.search?.trim()) params.set('search', filters.search.trim())
  const path = `/users?${params}`
  const [data, setData] = useState<UserPageResult>(EMPTY_PAGE)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      setData(await api<UserPageResult>(path))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Ma’lumotlarni yuklab bo‘lmadi.')
    } finally {
      setIsLoading(false)
    }
  }, [path])

  useEffect(() => {
    let active = true
    async function loadPage() {
      setIsLoading(true)
      setError('')
      try {
        const result = await api<UserPageResult>(path)
        if (active) setData(result)
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Ma’lumotlarni yuklab bo‘lmadi.')
      } finally {
        if (active) setIsLoading(false)
      }
    }
    void loadPage()
    return () => { active = false }
  }, [path])

  const createUser = useCallback(async (values: UserInput) => {
    const user = await api<User>('/users', { method: 'POST', body: JSON.stringify(values) })
    await refresh()
    return user
  }, [refresh])

  const updateUser = useCallback(async (userId: string, values: UserUpdateInput) => {
    const user = await api<User>(`/users/${userId}`, { method: 'PUT', body: JSON.stringify(values) })
    await refresh()
    return user
  }, [refresh])

  const setUserActive = useCallback(async (userId: string, isActive: boolean) => {
    const user = await api<User>(`/users/${userId}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) })
    await refresh()
    return user
  }, [refresh])

  return { data, isLoading, error, refresh, createUser, updateUser, setUserActive }
}
