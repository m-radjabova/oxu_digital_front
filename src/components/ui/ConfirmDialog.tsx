import type { ReactNode } from 'react'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded'
import Modal from './Modal'
import Button from './Button'

type Tone = 'danger' | 'brand'

const TONE_STYLES: Record<Tone, { outer: string; inner: string; icon: string }> = {
  danger: {
    outer: 'bg-rose-50 ring-rose-100',
    inner: 'bg-rose-100 text-rose-600',
    icon: 'text-rose-600',
  },
  brand: {
    outer: 'bg-brand-50 ring-brand-100',
    inner: 'bg-brand-100 text-brand-700',
    icon: 'text-brand-700',
  },
}

export default function ConfirmDialog({
  open,
  title,
  description,
  details,
  icon,
  confirmLabel = 'Tasdiqlash',
  cancelLabel = 'Bekor qilish',
  tone = 'danger',
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  description: string
  /** Ixtiyoriy: o'chirilayotgan element nomi yoki qo'shimcha ma'lumot */
  details?: ReactNode
  /** Ixtiyoriy: standart ikonkani almashtirish uchun */
  icon?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: Tone
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const styles = TONE_STYLES[tone]
  const defaultIcon =
    tone === 'danger' ? (
      <DeleteOutlineRoundedIcon fontSize="medium" />
    ) : (
      <HelpOutlineRoundedIcon fontSize="medium" />
    )

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      size="sm"
      ariaLabel={title}
      panelClassName="overflow-hidden"
    >
      <div role="alertdialog" aria-describedby="confirm-dialog-desc">
        <div className="p-5 pb-4 sm:p-7 sm:pb-5">
          <div className="flex items-start gap-4">
            {/* Ikonka: tashqi halqa + ichki doira */}
            <span
              className={`grid size-14 shrink-0 place-items-center rounded-full ring-8 ring-inset ${styles.outer}`}
              aria-hidden="true"
            >
              <span
                className={`grid size-10 place-items-center rounded-full ${styles.inner}`}
              >
                {icon ?? defaultIcon}
              </span>
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <h2 className="text-lg font-bold leading-6 text-slate-900">{title}</h2>
              <p
                id="confirm-dialog-desc"
                className="mt-1.5 text-sm leading-6 text-slate-500"
              >
                {description}
              </p>

              {details ? (
                <div className="mt-3 break-words rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700">
                  {details}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Tugmalar paneli */}
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            loading={loading}
            onClick={onConfirm}
            className="w-full sm:w-auto"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}