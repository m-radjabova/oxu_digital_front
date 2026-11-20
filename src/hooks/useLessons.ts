import { useCallback } from 'react'
import useApiResource from './useApiResource'
import { api } from '../lib/api'
import type { Lesson, LessonType } from '../types'

export interface LessonInput {
  groupIds: string[]
  type: LessonType
  subjectId: string
  teacherId: string
  dayOfWeek: number
  period: number
  weekStart: string
  roomId: string
}

export interface LessonQuery {
  teacherIds?: string
  weekStart?: string
  facultyId?: string
  departmentId?: string
  directionId?: string
}

export function useLessons(enabled = true, query: LessonQuery = {}) {
  const params = new URLSearchParams()
  if (query.weekStart) params.set('weekStart', query.weekStart)
  if (query.teacherIds) params.set('teacherIds', query.teacherIds)
  if (query.facultyId) params.set('facultyId', query.facultyId)
  if (query.departmentId) params.set('departmentId', query.departmentId)
  if (query.directionId) params.set('directionId', query.directionId)
  const search = params.toString()
  const path = search ? `/lessons?${search}` : '/lessons'
  const { data, isLoading, error, refresh } = useApiResource<Lesson>(path, enabled)

  const saveLesson = useCallback(async (values: LessonInput, lessonId?: string) => {
    const lesson = await api<Lesson>(lessonId ? `/lessons/${lessonId}` : '/lessons', {
      method: lessonId ? 'PUT' : 'POST',
      body: JSON.stringify(values),
    })
    await refresh()
    return lesson
  }, [refresh])

  const deleteLesson = useCallback(async (lessonId: string) => {
    await api(`/lessons/${lessonId}`, { method: 'DELETE' })
    await refresh()
  }, [refresh])

  return { data, isLoading, error, refresh, saveLesson, deleteLesson }
}
