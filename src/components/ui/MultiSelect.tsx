import { useEffect, useRef, useState } from 'react'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'

export interface MultiSelectOption {
  id: string
  label: string
  hint?: string
  disabled?: boolean
}

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Tanlang',
  emptyText = 'Variantlar mavjud emas.',
  disabled = false,
  ariaLabel,
}: {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  emptyText?: string
  disabled?: boolean
  ariaLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const selected = options.filter((option) => value.includes(option.id))

  function toggle(option: MultiSelectOption) {
    if (option.disabled) return
    onChange(value.includes(option.id) ? value.filter((id) => id !== option.id) : [...value, option.id])
  }

  return (
    <div className="relative mt-2" ref={rootRef}>
      <button
        type="button"
        className={`flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border bg-surface px-3 py-2 text-left text-sm shadow-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-50 ${
          open ? 'border-brand-500 ring-4 ring-brand-100' : 'border-slate-200'
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {selected.length ? (
            <>
              {selected.slice(0, 2).map((option) => (
                <span
                  key={option.id}
                  className="inline-flex max-w-full items-center truncate rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 ring-1 ring-inset ring-brand-100"
                >
                  {option.label}
                </span>
              ))}
              {selected.length > 2 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  +{selected.length - 2}
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>
        <ExpandMoreRoundedIcon
          sx={{ fontSize: 20 }}
          className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-surface shadow-lg"
          role="listbox"
          aria-label={ariaLabel}
          aria-multiselectable="true"
        >
          {options.length === 0 ? (
            <p className="px-3 py-3 text-xs leading-5 text-slate-500">{emptyText}</p>
          ) : (
            <ul className="max-h-56 overflow-y-auto py-1">
              {options.map((option) => {
                const checked = value.includes(option.id)
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={checked}
                      aria-disabled={option.disabled}
                      disabled={option.disabled}
                      title={option.disabled ? option.hint : undefined}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition ${
                        option.disabled
                          ? 'cursor-not-allowed text-slate-400'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                      onClick={() => toggle(option)}
                    >
                      <span
                        className={`grid size-5 shrink-0 place-items-center rounded-md border transition ${
                          option.disabled
                            ? 'border-slate-200 bg-slate-100 text-transparent'
                            : checked
                              ? 'border-brand-600 bg-brand-600 text-white'
                              : 'border-slate-300 bg-surface text-transparent'
                        }`}
                      >
                        <CheckRoundedIcon sx={{ fontSize: 14 }} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate font-medium ${option.disabled ? 'line-through decoration-slate-300' : ''}`}>
                          {option.label}
                        </span>
                        {option.hint && (
                          <span className={`block truncate text-[11px] ${option.disabled ? 'text-amber-600' : 'text-slate-400'}`}>
                            {option.hint}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {selected.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2">
              <span className="text-[11px] font-medium text-slate-500">{selected.length} ta tanlandi</span>
              <button
                type="button"
                className="text-[11px] font-semibold text-brand-700 hover:underline"
                onClick={() => onChange([])}
              >
                Tozalash
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
