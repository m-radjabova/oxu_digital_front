import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'

function pageItems(page: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }
  const items: Array<number | 'ellipsis'> = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)
  if (start > 2) items.push('ellipsis')
  for (let current = start; current <= end; current += 1) items.push(current)
  if (end < totalPages - 1) items.push('ellipsis')
  items.push(totalPages)
  return items
}

export default function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  const firstItem = (page - 1) * limit + 1
  const lastItem = Math.min(page * limit, total)

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="Sahifalash">
      <p className="text-xs font-medium text-slate-500">
        <span className="font-bold text-slate-700">{firstItem}–{lastItem}</span> / {total} ta
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-surface text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Oldingi sahifa"
        >
          <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
        </button>

        <div className="hidden items-center gap-1 sm:flex">
          {pageItems(page, totalPages).map((item, index) =>
            item === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="grid size-9 place-items-center text-xs text-slate-400">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className={`grid size-9 place-items-center rounded-xl text-xs font-semibold transition ${
                  item === page
                    ? 'bg-brand-600 text-white shadow-glow'
                    : 'border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                }`}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => onPageChange(item)}
              >
                {item}
              </button>
            ),
          )}
        </div>

        <span className="px-1 text-xs font-semibold text-slate-500 sm:hidden">{page} / {totalPages}</span>

        <button
          type="button"
          className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-surface text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Keyingi sahifa"
        >
          <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
        </button>
      </div>
    </nav>
  )
}
