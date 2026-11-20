import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import IconTile from './IconTile'

const CENTER_SIZES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  wide: 'max-w-7xl',
}

const DRAWER_SIZES = {
  sm: 'max-w-lg',
  md: 'max-w-xl lg:max-w-2xl',
  lg: 'max-w-2xl lg:max-w-3xl',
  xl: 'max-w-3xl lg:max-w-4xl xl:max-w-5xl',
  wide: 'max-w-full lg:max-w-[94vw] xl:max-w-[1400px]',
}

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  eyebrow?: string
  icon?: ReactNode
  size?: keyof typeof CENTER_SIZES
  placement?: 'center' | 'right'
  ariaLabel?: string
  panelClassName?: string
  scrollable?: boolean
  children: ReactNode
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  eyebrow,
  icon,
  size = 'md',
  placement = 'center',
  ariaLabel,
  panelClassName = '',
  scrollable = false,
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  // onClose ko'pincha har renderda yangi funksiya bo'ladi; ref orqali effekt qayta ishga tushmaydi
  // va formada yozayotganda fokus panelga "sakrab" ketmaydi.
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKeyDown)
    const timer = window.setTimeout(() => panelRef.current?.focus(), 30)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      window.clearTimeout(timer)
    }
  }, [open])

  if (!open) return null

  const isDrawer = placement === 'right'

  return createPortal(
    <div
      className={
        isDrawer
          ? 'fixed inset-0 z-[100] flex justify-end overflow-hidden bg-[#0f0c2d]/60 backdrop-blur-sm animate-fade-in'
          : 'fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-[#0f0c2d]/60 px-0 pb-0 pt-10 backdrop-blur-sm animate-fade-in sm:items-center sm:p-6'
      }
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title || 'Muloqot oynasi'}
        tabIndex={-1}
        className={
          isDrawer
            ? `fixed inset-y-0 right-0 flex h-full h-[100dvh] w-full flex-col border-l border-surface/60 bg-surface shadow-2xl outline-none animate-slide-in-right sm:rounded-l-3xl overflow-hidden ${DRAWER_SIZES[size]} ${panelClassName}`
            : `w-full ${CENTER_SIZES[size]} mt-auto animate-scale-in rounded-t-3xl border border-surface/60 bg-surface shadow-pop outline-none sm:my-auto sm:rounded-3xl ${scrollable ? 'flex max-h-[90dvh] flex-col overflow-hidden' : ''} ${panelClassName}`
        }
      >
        {(title || eyebrow || description) && (
          <div
            className={
              isDrawer
                ? 'relative isolate flex shrink-0 items-start justify-between gap-4 overflow-hidden border-b border-brand-100 bg-gradient-to-r from-brand-50/80 via-surface to-surface px-3 py-3 sm:px-5 sm:py-4'
                : 'relative isolate flex shrink-0 items-start justify-between gap-4 overflow-hidden border-b border-brand-100 bg-gradient-to-r from-brand-50/80 to-surface px-3 py-3 sm:px-5 sm:py-4'
            }
          >
            <svg className="pointer-events-none absolute right-12 top-0 -z-10 h-full w-48 text-brand-500 opacity-[0.08]" viewBox="0 0 192 120" fill="none" aria-hidden="true"><rect x="72" y="-30" width="96" height="96" rx="24" transform="rotate(25 120 18)" stroke="currentColor" strokeWidth="2" /><circle cx="142" cy="102" r="48" stroke="currentColor" strokeWidth="2" /><path d="M22 64h16m-8-8v16M174 30h12m-6-6v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            <div className="flex min-w-0 items-start gap-2.5">
              {icon && (
                <IconTile className="size-12 bg-brand-100 text-brand-700 shadow-sm [&_svg]:size-6">
                  {icon}
                </IconTile>
              )}
              <div className="min-w-0">
                {eyebrow && (
                  <span className="block text-[11px] font-bold uppercase tracking-[.16em] text-brand-600">
                    {eyebrow}
                  </span>
                )}
                {title && (
                  <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 active:scale-95"
              aria-label="Yopish"
              onClick={onClose}
            >
              <CloseRoundedIcon sx={{ fontSize: 19 }} />
            </button>
          </div>
        )}
        {isDrawer || scrollable ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </div>,
    document.body,
  )
}
