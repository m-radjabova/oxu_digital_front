import { createContext } from 'react'

export interface TelegramStatus {
  linked: boolean
  botUrl: string | null
  lessonReminder?: {
    enabled: boolean
    minutesBefore: number
    timeZone: string
  }
}

export interface TelegramContextValue {
  status: TelegramStatus | null
  isLoading: boolean
  error: string
  linkUrl: string
  isMutating: boolean
  /** Telegram Mini App ichida ochilganmi — u yerda ulash taklifi kerak emas */
  isInsideTelegram: boolean
  promptOpen: boolean
  openPrompt: () => void
  closePrompt: () => void
  refresh: () => Promise<void>
  createLink: () => Promise<string | null>
  unlink: () => Promise<boolean>
}

const TelegramContext = createContext<TelegramContextValue | null>(null)

export default TelegramContext
