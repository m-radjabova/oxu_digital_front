import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import TelegramContext, { type TelegramStatus } from '../context/TelegramContext'
import useToast from '../hooks/useToast'
import { api } from '../lib/api'

interface TelegramLinkCode {
  url: string
  expiresAt: string
}

type TelegramWebAppWindow = Window & { Telegram?: { WebApp?: { initData?: string } } }

const POLL_INTERVAL = 3000

// Har bir yangi kirish (yangi token) uchun taklif qayta ko‘rsatiladi.
function promptDismissKey() {
  const token = localStorage.getItem('oxu-token') || ''
  return `oxu-telegram-prompt:${token.slice(-24)}`
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export default function TelegramProvider({ children }: { children: ReactNode }) {
  const toast = useToast()
  const [status, setStatus] = useState<TelegramStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkExpiresAt, setLinkExpiresAt] = useState(0)
  const [isMutating, setIsMutating] = useState(false)
  const [promptOpen, setPromptOpen] = useState(false)
  const autoPromptChecked = useRef(false)
  const wasLinked = useRef<boolean | null>(null)
  const isInsideTelegram = Boolean((window as TelegramWebAppWindow).Telegram?.WebApp?.initData)

  const applyStatus = useCallback((next: TelegramStatus) => {
    setError('')
    if (wasLinked.current === false && next.linked) {
      toast.success('Telegram akkauntingiz muvaffaqiyatli ulandi.', 'Telegram')
    }
    wasLinked.current = next.linked
    setStatus(next)
    if (next.linked) {
      setLinkUrl('')
      setLinkExpiresAt(0)
    }
  }, [toast])

  const fetchStatus = useCallback(async () => {
    try {
      applyStatus(await api<TelegramStatus>('/telegram/me'))
    } catch (requestError) {
      setError(errorMessage(requestError, 'Telegram holatini tekshirib bo‘lmadi.'))
    } finally {
      setIsLoading(false)
    }
  }, [applyStatus])

  useEffect(() => {
    let active = true
    api<TelegramStatus>('/telegram/me')
      .then((next) => {
        if (active) applyStatus(next)
      })
      .catch((requestError: unknown) => {
        if (active) setError(errorMessage(requestError, 'Telegram holatini tekshirib bo‘lmadi.'))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => { active = false }
  }, [applyStatus])

  // Kirgandan keyin Telegram ulanmagan bo‘lsa — ulash taklifini bir marta ochamiz.
  useEffect(() => {
    if (autoPromptChecked.current || isLoading || !status) return
    autoPromptChecked.current = true
    if (status.linked || isInsideTelegram) return
    if (sessionStorage.getItem(promptDismissKey())) return
    const timer = window.setTimeout(() => setPromptOpen(true), 700)
    return () => window.clearTimeout(timer)
  }, [isInsideTelegram, isLoading, status])

  // Havola yaratilgach bot orqali tasdiqlanishini kutamiz.
  useEffect(() => {
    if (!linkUrl || status?.linked) return
    const timer = window.setInterval(() => {
      if (linkExpiresAt && Date.now() > linkExpiresAt) {
        setLinkUrl('')
        setLinkExpiresAt(0)
        return
      }
      void fetchStatus()
    }, POLL_INTERVAL)
    function onFocus() {
      void fetchStatus()
    }
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [fetchStatus, linkExpiresAt, linkUrl, status?.linked])

  const createLink = useCallback(async () => {
    setIsMutating(true)
    try {
      const result = await api<TelegramLinkCode>('/telegram/link-code', { method: 'POST' })
      setLinkUrl(result.url)
      setLinkExpiresAt(new Date(result.expiresAt).getTime() || 0)
      return result.url
    } catch (requestError) {
      toast.error(errorMessage(requestError, 'Telegram uchun havola yaratilmadi.'))
      return null
    } finally {
      setIsMutating(false)
    }
  }, [toast])

  const unlink = useCallback(async () => {
    setIsMutating(true)
    try {
      await api('/telegram/link', { method: 'DELETE' })
      wasLinked.current = false
      setStatus((current) => (current ? {
        ...current,
        linked: false,
        lessonReminder: current.lessonReminder ? { ...current.lessonReminder, enabled: false } : undefined,
      } : current))
      setLinkUrl('')
      setLinkExpiresAt(0)
      toast.success('Telegram akkaunti uzildi.')
      return true
    } catch (requestError) {
      toast.error(errorMessage(requestError, 'Telegram akkauntini uzib bo‘lmadi.'))
      return false
    } finally {
      setIsMutating(false)
    }
  }, [toast])

  const openPrompt = useCallback(() => setPromptOpen(true), [])
  const closePrompt = useCallback(() => {
    sessionStorage.setItem(promptDismissKey(), '1')
    setPromptOpen(false)
  }, [])

  const value = useMemo(() => ({
    status,
    isLoading,
    error,
    linkUrl,
    isMutating,
    isInsideTelegram,
    promptOpen,
    openPrompt,
    closePrompt,
    refresh: fetchStatus,
    createLink,
    unlink,
  }), [closePrompt, createLink, error, fetchStatus, isInsideTelegram, isLoading, isMutating, linkUrl, openPrompt, promptOpen, status, unlink])

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>
}
