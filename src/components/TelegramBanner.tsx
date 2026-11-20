import TelegramIcon from '@mui/icons-material/Telegram'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import useTelegram from '../hooks/useTelegram'
import Button from './ui/Button'

/** Telegram ulanmagan foydalanuvchiga dashboard tepasida ko‘rinadigan eslatma */
export default function TelegramBanner({ className = '' }: { className?: string }) {
  const { status, isInsideTelegram, linkUrl, openPrompt } = useTelegram()
  if (!status || status.linked || isInsideTelegram) return null

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-sky-200/80 bg-gradient-to-r from-sky-50 via-surface to-indigo-50 p-4 shadow-card animate-slide-up sm:p-5 ${className}`}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-sky-200/40 blur-2xl" aria-hidden="true" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="relative grid size-12 shrink-0 place-items-center">
          <span className="absolute inset-0 rounded-2xl bg-sky-400/30 animate-pulse-ring" aria-hidden="true" />
          <span className="relative grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-[0_10px_24px_-10px_rgb(14_165_233/0.8)]">
            <TelegramIcon sx={{ fontSize: 26 }} />
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-slate-900">Telegram botga ulaning</h3>
          <p className="mt-0.5 text-sm leading-6 text-slate-600">
            {linkUrl
              ? 'Havola tayyor — Telegram’da “Start” ni bosing, ulanish avtomatik tasdiqlanadi.'
              : 'Dars eslatmalari, jadval o‘zgarishlari va davomat natijalarini Telegram’da oling.'}
          </p>
        </div>
        <Button
          variant="telegram"
          className="shrink-0"
          endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />}
          onClick={openPrompt}
        >
          {linkUrl ? 'Davom etish' : 'Hozir ulash'}
        </Button>
      </div>
    </div>
  )
}
