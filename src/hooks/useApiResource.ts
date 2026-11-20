import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { subscribeToRealtime, type RealtimeEvent } from '../lib/realtime'

type RefreshOptions = { background?: boolean; fresh?: boolean }

function shouldRefresh(path: string, event: RealtimeEvent) {
  if (event.type === 'reconnected') return true

  const [pathname, search = ''] = path.split('?')
  if (event.type === 'lessons:changed') {
    return pathname === '/lessons'
      || pathname === '/buildings'
      || (pathname === '/attendance' && Boolean(new URLSearchParams(search).get('date')))
  }
  if (event.type === 'attendance:changed') {
    return pathname === '/attendance' || pathname === '/attendance/me'
  }
  if (event.type === 'teacher-availability:changed') {
    return pathname === '/teacher-availability'
  }
  return pathname === '/buildings' || pathname === '/rooms'
}

export default function useApiResource<T>(path: string, enabled = true) {
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState('')
  const requestSequence = useRef(0)

  const refresh = useCallback(async ({ background = false, fresh = false }: RefreshOptions = {}) => {
    if (!enabled) {
      setData([])
      setIsLoading(false)
      return
    }

    const sequence = ++requestSequence.current
    if (!background) setIsLoading(true)
    setError('')
    try {
      const result = await api<T[]>(path, { dedupe: !fresh })
      if (requestSequence.current === sequence) setData(result)
    } catch (requestError) {
      if (requestSequence.current === sequence) {
        setError(requestError instanceof Error ? requestError.message : 'Ma’lumotlarni yuklab bo‘lmadi.')
      }
    } finally {
      if (requestSequence.current === sequence) setIsLoading(false)
    }
  }, [enabled, path])

  useEffect(() => {
    let active = true
    async function loadResource() {
      if (!enabled) {
        requestSequence.current += 1
        if (active) {
          setData([])
          setError('')
          setIsLoading(false)
        }
        return
      }
      await refresh()
    }

    void loadResource()
    return () => {
      active = false
      requestSequence.current += 1
    }
  }, [enabled, path, refresh])

  useEffect(() => {
    if (!enabled) return
    return subscribeToRealtime((event) => {
      if (shouldRefresh(path, event)) {
        void refresh({ background: true, fresh: true })
      }
    })
  }, [enabled, path, refresh])

  return { data, isLoading, error, refresh }
}
