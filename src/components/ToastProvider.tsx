import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ToastContext, { type ToastApi, type ToastOptions, type ToastVariant } from '../context/ToastContext'

interface ToastItem {
  id: number
  message: string
  title: string
  variant: ToastVariant
  duration: number
}

const DEFAULT_TITLES: Record<ToastVariant, string> = {
  success: 'Muvaffaqiyatli',
  error: 'Xatolik yuz berdi',
  warning: 'Diqqat',
  info: 'Ma’lumot',
}

const DEFAULT_DURATIONS: Record<ToastVariant, number> = {
  success: 4500,
  info: 4500,
  warning: 6000,
  error: 7000,
}

const STYLES: Record<ToastVariant, { icon: ReactNode; iconClass: string; bar: string }> = {
  success: {
    icon: <CheckCircleRoundedIcon sx={{ fontSize: 20 }} />,
    iconClass: 'bg-emerald-50 text-emerald-600',
    bar: 'bg-emerald-500',
  },
  error: {
    icon: <ErrorOutlineRoundedIcon sx={{ fontSize: 20 }} />,
    iconClass: 'bg-rose-50 text-rose-600',
    bar: 'bg-rose-500',
  },
  warning: {
    icon: <WarningAmberRoundedIcon sx={{ fontSize: 20 }} />,
    iconClass: 'bg-amber-50 text-amber-600',
    bar: 'bg-amber-500',
  },
  info: {
    icon: <InfoOutlinedIcon sx={{ fontSize: 20 }} />,
    iconClass: 'bg-brand-50 text-brand-700',
    bar: 'bg-brand-500',
  },
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [leaving, setLeaving] = useState<number[]>([])
  const toastsRef = useRef<ToastItem[]>([])
  const idRef = useRef(0)
  const leavingRef = useRef(new Set<number>())

  const dismiss = useCallback((id: number) => {
    if (leavingRef.current.has(id)) return
    leavingRef.current.add(id)
    setLeaving((current) => [...current, id])
    window.setTimeout(() => {
      const nextToasts = toastsRef.current.filter((toast) => toast.id !== id)
      toastsRef.current = nextToasts
      setToasts(nextToasts)
      setLeaving((current) => current.filter((item) => item !== id))
      leavingRef.current.delete(id)
    }, 220)
  }, [])

  const push = useCallback((options: ToastOptions) => {
    const variant = options.variant || 'info'
    const duplicate = toastsRef.current.find((toast) => (
      toast.variant === variant && toast.message === options.message
    ))
    if (duplicate) return duplicate.id

    const id = ++idRef.current
    const toast: ToastItem = {
      id,
      message: options.message,
      title: options.title || DEFAULT_TITLES[variant],
      variant,
      duration: options.duration || DEFAULT_DURATIONS[variant],
    }
    const nextToasts = [...toastsRef.current.slice(-2), toast]
    toastsRef.current = nextToasts
    setToasts(nextToasts)
    return id
  }, [])

  const value = useMemo<ToastApi>(() => ({
    push,
    dismiss,
    success: (message, title) => push({ message, title, variant: 'success' }),
    error: (message, title) => push({ message, title, variant: 'error' }),
    info: (message, title) => push({ message, title, variant: 'info' }),
    warning: (message, title) => push({ message, title, variant: 'warning' }),
  }), [dismiss, push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          aria-relevant="additions"
          className="pointer-events-none fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[140] flex flex-col gap-3 sm:inset-x-auto sm:right-6 md:bottom-6 sm:w-[380px]"
        >
          {toasts.map((toast) => (
            <ToastCard
              key={toast.id}
              toast={toast}
              leaving={leaving.includes(toast.id)}
              onDismiss={dismiss}
            />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

function ToastCard({ toast, leaving, onDismiss }: { toast: ToastItem; leaving: boolean; onDismiss: (id: number) => void }) {
  const style = STYLES[toast.variant]

  useEffect(() => {
    if (leaving) return
    const timer = window.setTimeout(() => onDismiss(toast.id), toast.duration)
    return () => window.clearTimeout(timer)
  }, [leaving, onDismiss, toast.duration, toast.id])

  return (
    <div className="pointer-events-auto animate-toast-in">
      <div
        className={`relative flex items-start gap-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-surface/95 p-4 shadow-pop backdrop-blur transition-all duration-200 ${leaving ? 'translate-y-1 scale-[0.97] opacity-0' : 'opacity-100'}`}
        role={toast.variant === 'error' ? 'alert' : 'status'}
      >
        <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${style.iconClass}`} aria-hidden="true">
          {style.icon}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-bold leading-5 text-slate-900">{toast.title}</p>
          <p className="mt-0.5 text-sm leading-5 text-slate-600">{toast.message}</p>
        </div>
        <button
          type="button"
          className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Bildirishnomani yopish"
          onClick={() => onDismiss(toast.id)}
        >
          <CloseRoundedIcon sx={{ fontSize: 16 }} />
        </button>
        {!leaving && (
          <span
            aria-hidden="true"
            className={`toast-progress absolute inset-x-0 bottom-0 h-[3px] ${style.bar}`}
            style={{ animationDuration: `${toast.duration}ms` }}
          />
        )}
      </div>
    </div>
  )
}
