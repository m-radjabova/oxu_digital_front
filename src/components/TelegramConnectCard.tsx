import { useState } from 'react'
import TelegramIcon from '@mui/icons-material/Telegram'
import LinkRoundedIcon from '@mui/icons-material/LinkRounded'
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded'
import useAuth from '../hooks/useAuth'
import useTelegram from '../hooks/useTelegram'
import Badge from './ui/Badge'
import Button, { Spinner } from './ui/Button'
import Card, { SectionHeader } from './ui/Card'
import ConfirmDialog from './ui/ConfirmDialog'

export default function TelegramConnectCard() {
  const { user } = useAuth()
  const { status, isLoading, error, linkUrl, isMutating, openPrompt, unlink } = useTelegram()
  const [confirmUnlink, setConfirmUnlink] = useState(false)

  return (
    <>
      <Card className="p-5 sm:p-6">
        <SectionHeader
          icon={<TelegramIcon sx={{ fontSize: 19 }} />}
          title="Telegram botga ulash"
          description="Ulangan Telegram akkaunt orqali botdan jadval va boshqa ruxsat etilgan bo‘limlarni boshqaring."
          action={status?.linked
            ? <Badge tone="success" dot>Ulangan</Badge>
            : status ? <Badge tone="warning" dot>Ulanmagan</Badge> : undefined}
        />

        {error ? (
          <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        ) : isLoading ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <Spinner className="size-3.5" />
            Telegram holati tekshirilmoqda…
          </p>
        ) : status?.linked ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">OXU akkauntingiz Telegram profilingizga xavfsiz ulangan.</p>
            <Button
              variant="dangerSoft"
              size="sm"
              startIcon={<LinkOffRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={() => setConfirmUnlink(true)}
            >
              Uzish
            </Button>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              variant="telegram"
              size="sm"
              startIcon={<LinkRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={openPrompt}
            >
              Telegram botga ulash
            </Button>
            <p className="text-xs leading-5 text-slate-500">
              Bir martalik havola 15 daqiqa amal qiladi; u Telegram parolingizni so‘ramaydi.
            </p>
            {linkUrl && (
              <a
                href={linkUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center gap-1.5 text-sm font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4"
              >
                <OpenInNewRoundedIcon sx={{ fontSize: 15 }} />
                Telegram’da davom etish
              </a>
            )}
          </div>
        )}
        {user?.role === 'teacher' && status && !isLoading && !error && (
          <div className={`mt-4 flex items-start gap-3 rounded-2xl border p-4 ${
            status.lessonReminder?.enabled ? 'border-sky-200 bg-sky-50/70' : 'border-slate-200 bg-slate-50'
          }`}>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-600">
              <NotificationsActiveRoundedIcon sx={{ fontSize: 21 }} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">
                {status.lessonReminder?.enabled ? 'Dars eslatmalari yoqilgan' : 'Dars eslatmalari'}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                {status.lessonReminder?.enabled
                  ? `Har bir darsdan ${status.lessonReminder.minutesBefore} daqiqa oldin Telegram’ga fan, guruh, vaqt va xona bilan eslatma keladi. Sayt yopiq bo‘lsa ham ishlaydi. Vaqt: Toshkent.`
                  : status.linked
                    ? 'Eslatma xizmati hozircha faol emas. Keyinroq qayta tekshiring.'
                    : 'Telegram botga ulaning — dars boshlanishidan 10 daqiqa oldin avtomatik eslatma oling.'}
              </p>
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirmUnlink}
        title="Telegram akkauntini uzasizmi?"
        description={user?.role === 'teacher'
          ? 'Uzilgandan keyin Telegram dars eslatmalari kelmaydi va botdagi OXU bo‘limlariga kira olmaysiz. Keyin profildan qayta ulash mumkin.'
          : 'Uzilgandan keyin botdagi OXU bo‘limlariga kira olmaysiz. Keyin profildan qayta ulash mumkin.'}
        confirmLabel="Uzish"
        tone="danger"
        loading={isMutating}
        onConfirm={() => {
          void unlink().then((done) => {
            if (done) setConfirmUnlink(false)
          })
        }}
        onClose={() => setConfirmUnlink(false)}
      />
    </>
  )
}
