import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import AuthContext from '../context/AuthContext'
import { ApiError, api, setAccessToken } from '../lib/api'
import { connectRealtime, disconnectRealtime } from '../lib/realtime'
import type { User } from '../types'

const storedToken = () => localStorage.getItem('oxu-token') || sessionStorage.getItem('oxu-token')

type TelegramWebAppWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string
      initDataUnsafe?: { user?: { id?: number } }
      ready?: () => void
      expand?: () => void
    }
  }
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(() =>
    Boolean(storedToken() || (window as TelegramWebAppWindow).Telegram?.WebApp?.initData),
  )
  const userId = user?.id

  const handleAuthFailure = useCallback((error: unknown) => {
    if (!(error instanceof ApiError) || error.status === 0 || error.status >= 500) {
      setAuthError(error instanceof Error ? error.message : 'Hisobni tekshirib bo‘lmadi.')
      return
    }
    localStorage.removeItem('oxu-token')
    sessionStorage.removeItem('oxu-token')
    localStorage.removeItem('oxu-telegram-id')
    setAccessToken(null)
    disconnectRealtime()
    setUser(null)
  }, [])

  useEffect(() => {
    if (!userId) return
    const token = storedToken()
    if (!token) return
    return connectRealtime(token)
  }, [userId])

  useEffect(() => {
    const token = storedToken()
    const webApp = (window as TelegramWebAppWindow).Telegram?.WebApp
    const telegramUserId = webApp?.initDataUnsafe?.user?.id
    const linkedTelegramUserId = localStorage.getItem('oxu-telegram-id')
    if (
      token &&
      telegramUserId !== undefined &&
      linkedTelegramUserId === String(telegramUserId)
    ) {
      setAccessToken(token)
      api<User>('/auth/me')
        .then(setUser)
        .catch(handleAuthFailure)
        .finally(() => setIsLoading(false))
      return
    }

    if (webApp?.initData) {
      webApp.ready?.()
      webApp.expand?.()
      api<{ token: string; user: User; telegramUserId: string }>('/auth/telegram-webapp', {
        method: 'POST',
        body: JSON.stringify({ initData: webApp.initData }),
        auth: false,
      })
        .then((result) => {
          localStorage.setItem('oxu-token', result.token)
          localStorage.setItem('oxu-telegram-id', result.telegramUserId)
          setAccessToken(result.token)
          setUser(result.user)
        })
        .catch(handleAuthFailure)
        .finally(() => setIsLoading(false))
      return
    }
    if (!token) return

    setAccessToken(token)
    api<User>('/auth/me')
      .then(setUser)
      .catch(handleAuthFailure)
      .finally(() => setIsLoading(false))
  }, [handleAuthFailure])

  const login = useCallback(async (email: string, password: string, remember = true) => {
    setAuthError(null)
    const result = await api<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      auth: false,
    })
    localStorage.removeItem('oxu-token')
    sessionStorage.removeItem('oxu-token')
    ;(remember ? localStorage : sessionStorage).setItem('oxu-token', result.token)
    localStorage.removeItem('oxu-telegram-id')
    setAccessToken(result.token)
    setUser(result.user)
    setAuthError(null)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('oxu-token')
    sessionStorage.removeItem('oxu-token')
    localStorage.removeItem('oxu-telegram-id')
    setAccessToken(null)
    disconnectRealtime()
    setUser(null)
    setAuthError(null)
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, authError, login, logout }),
    [user, isLoading, authError, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
