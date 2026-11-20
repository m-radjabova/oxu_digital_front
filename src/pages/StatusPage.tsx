import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import Button from '../components/ui/Button'
import useAuth from '../hooks/useAuth'

type StatusCode = 401 | 403 | 500

const STATUS_CONTENT: Record<StatusCode, {
  label: string
  title: string
  description: string
  icon: ReactNode
  iconClass: string
}> = {
  401: {
    label: 'QAYTA KIRISH KERAK',
    title: 'Sessiyangiz tugagan bo‘lishi mumkin',
    description: 'Davom etish uchun hisobingizga qayta kiring.',
    icon: <LockOutlinedIcon sx={{ fontSize: 34 }} />,
    iconClass: 'bg-amber-50 text-amber-600 ring-amber-100',
  },
  403: {
    label: 'KIRISH CHEKLANGAN',
    title: 'Bu bo‘lim siz uchun yopiq',
    description: 'Bosh sahifaga qayting. Kerak bo‘lsa, mas’ul xodimdan yordam so‘rang.',
    icon: <HomeRoundedIcon sx={{ fontSize: 34 }} />,
    iconClass: 'bg-brand-50 text-brand-600 ring-brand-100',
  },
  500: {
    label: 'BIR OZ KUTING',
    title: 'Kutilmagan muammo yuz berdi',
    description: 'So‘rovingizni hozir bajara olmadik. Birozdan keyin qayta urinib ko‘ring.',
    icon: <ErrorOutlineRoundedIcon sx={{ fontSize: 34 }} />,
    iconClass: 'bg-rose-50 text-rose-600 ring-rose-100',
  },
}

export default function StatusPage({ status }: { status: StatusCode }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const content = STATUS_CONTENT[status]
  const homePath = user ? `/${user.role}/dashboard` : '/login'
  const isServerError = status === 500

  function handlePrimaryAction() {
    if (status === 401) {
      navigate('/login', { replace: true })
      return
    }
    if (isServerError) {
      window.location.reload()
      return
    }
    navigate(homePath, { replace: true })
  }

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-canvas px-4 py-10">
      <div aria-hidden="true" className="pointer-events-none absolute -left-36 -top-40 size-96 rounded-full bg-brand-200/30 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -right-36 size-[30rem] rounded-full bg-indigo-200/30 blur-3xl" />

      <section
        aria-labelledby="status-title"
        className="relative w-full max-w-xl rounded-[2rem] border border-white/80 bg-surface px-6 py-10 text-center shadow-pop sm:px-12 sm:py-12"
      >
        <div className="mx-auto flex w-fit items-center gap-2">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-600 text-lg font-black text-white shadow-glow">
            O
          </span>
          <span className="text-left text-sm font-extrabold tracking-wide text-slate-900">
            OXU <span className="text-brand-600">DIGITAL</span>
            <small className="mt-0.5 block text-[9px] font-bold tracking-[.18em] text-slate-500">TA’LIM BOSHQARUVI</small>
          </span>
        </div>

        <div className={`mx-auto mt-9 grid size-[4.5rem] place-items-center rounded-2xl ring-1 ring-inset ${content.iconClass}`}>
          {content.icon}
        </div>
        <p className="mt-6 text-xs font-extrabold tracking-[.2em] text-brand-600">{content.label}</p>
        <p className="mt-2 text-7xl font-black leading-none tracking-[-.07em] text-slate-900 sm:text-8xl">
          {status}
        </p>
        <h1 id="status-title" className="mt-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {content.title}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500 sm:text-base">
          {content.description}
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            startIcon={status === 401
              ? <LockOutlinedIcon sx={{ fontSize: 18 }} />
              : isServerError
                ? <RefreshRoundedIcon sx={{ fontSize: 18 }} />
                : <HomeRoundedIcon sx={{ fontSize: 18 }} />}
            onClick={handlePrimaryAction}
          >
            {status === 401 ? 'Tizimga kirish' : isServerError ? 'Qayta urinib ko‘rish' : 'Bosh sahifaga qaytish'}
          </Button>
          {isServerError && (
            <Button
              variant="secondary"
              size="lg"
              startIcon={<HomeRoundedIcon sx={{ fontSize: 18 }} />}
              onClick={() => navigate(homePath, { replace: true })}
            >
              Bosh sahifa
            </Button>
          )}
        </div>
      </section>
    </main>
  )
}
