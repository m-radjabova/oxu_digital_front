import { createContext } from 'react'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface ToastOptions {
  message: string
  title?: string
  variant?: ToastVariant
  duration?: number
}

export interface ToastApi {
  push: (options: ToastOptions) => number
  dismiss: (id: number) => void
  success: (message: string, title?: string) => number
  error: (message: string, title?: string) => number
  info: (message: string, title?: string) => number
  warning: (message: string, title?: string) => number
}

const ToastContext = createContext<ToastApi | null>(null)

export default ToastContext
