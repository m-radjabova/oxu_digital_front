import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { AcademicStructureData } from '../types'

const EMPTY_STRUCTURE: AcademicStructureData = {
  faculties: [],
  departments: [],
  directions: [],
}

export function useAcademicStructure() {
  const [data, setData] = useState(EMPTY_STRUCTURE)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      setData(await api<AcademicStructureData>('/academic-structure'))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Ta’lim tuzilmasini yuklab bo‘lmadi.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    async function loadStructure() {
      try {
        const structure = await api<AcademicStructureData>('/academic-structure')
        if (active) setData(structure)
      } catch (requestError) {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : 'Ta’lim tuzilmasini yuklab bo‘lmadi.')
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadStructure()
    return () => { active = false }
  }, [])

  return { ...data, isLoading, error, refresh }
}
