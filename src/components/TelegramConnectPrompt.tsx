import TelegramIcon from '@mui/icons-material/Telegram'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded'
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import useAuth from '../hooks/useAuth'
import useTelegram from '../hooks/useTelegram'
import type { Role } from '../types'
import Button, { Spinner } from './ui/Button'
import { buttonClass } from './ui/buttonStyles'
import Modal from './ui/Modal'

const BENEFITS: Record<Role, { icon: typeof TelegramIcon; title: string; text: string }[]> = {
  admin: [
    { icon: NotificationsActiveRoundedIcon, title: 'Tezkor bildirishnomalar', text: 'Jadvaldagi o‘zgarishlar haqida darhol xabar oling.' },
    { icon: CalendarMonthRoundedIcon, title: 'Jadval doim yoningizda', text: 'Telegram’dan chiqmasdan jadvalni ko‘ring.' },
    { icon: ShieldRoundedIcon, title: 'Xavfsiz kirish', text: 'Bot orqali parolsiz va xavfsiz kirasiz.' },
  ],
  teacher: [
    { icon: NotificationsActiveRoundedIcon, title: '10 daqiqalik dars eslatmalari', text: 'Har bir darsdan 10 daqiqa oldin fan, guruh va xona bilan eslatma oling — sayt yopiq bo‘lsa ham.' },
    { icon: CalendarMonthRoundedIcon, title: 'Jadval o‘zgarishlari', text: 'Yangi yoki ko‘chirilgan darslar haqida darhol bilasiz.' },
    { icon: FactCheckRoundedIcon, title: 'Davomat bir bosishda', text: 'Bot orqali davomat sahifasiga tez o‘ting.' },
  ],
  student: [
    { icon: NotificationsActiveRoundedIcon, title: 'Dars eslatmalari', text: 'Dars boshlanishidan oldin xabar olasiz.' },
    { icon: CalendarMonthRoundedIcon, title: 'Jadval o‘zgarishlari', text: 'Xona yoki vaqt o‘zgarsa — birinchi bo‘lib bilasiz.' },
    { icon: FactCheckRoundedIcon, title: 'Davomat natijalari', text: 'Davomatingizni Telegram’da kuzatib boring.' },
  ],
}

const STEPS = [
  '“Telegram botga ulash” tugmasini bosing',
  'Telegram’da botni ochib, “Start” ni bosing',
  'Shu sahifaga qayting — ulanish avtomatik tasdiqlanadi',
]

export default function TelegramConnectPrompt() {
  const { user } = useAuth()
  const { status, promptOpen, closePrompt, linkUrl, isMutating, createLink, refresh } = useTelegram()
  const linked = Boolean(status?.linked)
  const waiting = Boolean(linkUrl) && !linked

  async function connect() {
    // Brauzer popup’ni bloklamasligi uchun oynani darhol ochamiz, havolani keyin beramiz.
    const tab = window.open('about:blank', '_blank')
    const url = await createLink()
    if (!url) {
      tab?.close()
      return
    }
    if (tab) {
      tab.opener = null
      tab.location.href = url
    } else {
      window.location.href = url
    }
  }

  if (!user) return null

  return (
    <Modal open={promptOpen} onClose={closePrompt} size="md" ariaLabel="Telegram botga ulanish">
      <div className="theme-fixed relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 px-6 pb-8 pt-9 text-center text-white">
        <div className="auth-dots pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-10 -top-16 size-48 rounded-full bg-white/15 blur-2xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 size-56 rounded-full bg-indigo-400/30 blur-2xl" aria-hidden="true" />
        <button
          type="button"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl bg-white/15 text-white transition hover:bg-white/25"
          aria-label="Yopish"
          onClick={closePrompt}
        >
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </button>

        <span className="relative mx-auto grid size-20 place-items-center">
          {!linked && <span className="absolute inset-0 rounded-full bg-white/40 animate-pulse-ring" aria-hidden="true" />}
          <span className="relative grid size-20 place-items-center rounded-full bg-white text-sky-500 shadow-[0_18px_40px_-12px_rgb(2_132_199/0.7)]">
            {linked ? <CheckRoundedIcon sx={{ fontSize: 44 }} className="text-emerald-500" /> : <TelegramIcon sx={{ fontSize: 46 }} />}
          </span>
        </span>
        <h2 className="relative mt-5 text-2xl font-bold tracking-tight">
          {linked ? 'Telegram ulandi!' : 'Telegram botga ulaning'}
        </h2>
        <p className="relative mx-auto mt-2 max-w-sm text-sm leading-6 text-sky-50">
          {linked
            ? 'Endi barcha muhim xabarlar to‘g‘ridan-to‘g‘ri Telegram’ingizga keladi.'
            : `${user.name.split(' ')[0]}, hisobingiz hali Telegram botga ulanmagan. Ulab qo‘ying — hech narsani o‘tkazib yubormaysiz.`}
        </p>
      </div>

      <div className="px-5 py-6 sm:px-7">
        {linked ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Ulanishni istalgan vaqtda <b>Profil</b> bo‘limidan boshqarishingiz mumkin.
          </div>
        ) : waiting ? (
          <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 text-center">
            <span className="mx-auto flex w-fit items-center gap-2 text-sm font-semibold text-sky-700">
              <Spinner className="size-4" />
              Telegram’dan tasdiq kutilmoqda…
            </span>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Botda “Start” tugmasini bosing. Sahifa o‘zi yangilanadi — hech narsa qilish shart emas.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <a href={linkUrl} target="_blank" rel="noreferrer" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                <OpenInNewRoundedIcon sx={{ fontSize: 16 }} />
                Telegram’ni qayta ochish
              </a>
              <Button variant="ghost" size="sm" startIcon={<RefreshRoundedIcon sx={{ fontSize: 16 }} />} onClick={() => void refresh()}>
                Tekshirish
              </Button>
            </div>
          </div>
        ) : (
          <>
            <ul className="grid gap-2.5">
              {BENEFITS[user.role].map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-600">
                    <Icon sx={{ fontSize: 20 }} />
                  </span>
                  <span className="min-w-0">
                    <b className="block text-sm font-semibold text-slate-900">{title}</b>
                    <small className="mt-0.5 block text-xs leading-5 text-slate-500">{text}</small>
                  </span>
                </li>
              ))}
            </ul>
            <ol className="mt-5 grid gap-2">
              {STEPS.map((step, index) => (
                <li key={step} className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700 ring-1 ring-brand-100">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {linked ? (
            <Button fullWidth onClick={closePrompt}>Davom etish</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={closePrompt}>Keyinroq</Button>
              {!waiting && (
                <Button
                  variant="telegram"
                  loading={isMutating}
                  loadingText="Tayyorlanmoqda…"
                  startIcon={<TelegramIcon sx={{ fontSize: 18 }} />}
                  className="sm:min-w-56"
                  onClick={() => void connect()}
                >
                  Telegram botga ulash
                </Button>
              )}
            </>
          )}
        </div>
        {!linked && (
          <p className="mt-4 text-center text-[11px] leading-5 text-slate-400">
            Bir martalik havola 15 daqiqa amal qiladi. Telegram parolingiz so‘ralmaydi.
          </p>
        )}
      </div>
    </Modal>
  )
}
