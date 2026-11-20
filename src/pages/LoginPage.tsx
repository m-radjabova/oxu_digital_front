import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import campus from '../assets/oxu-login.jpg'
import useAuth from '../hooks/useAuth'
import useToast from '../hooks/useToast'
import { api } from '../lib/api'
import PageLoader from '../components/PageLoader'

type LoginValues = { email: string; password: string }
const features = [
  { icon: <GroupsOutlinedIcon />, text: <>Talaba va guruhlar<br />boshqaruvi</> },
  { icon: <CalendarMonthRoundedIcon />, text: <>Dars jadvali<br />va davomat</> },
  { icon: <BarChartRoundedIcon />, text: <>Hisobotlar<br />va tahlil</> },
]
const fieldClass = 'h-14 w-full rounded-2xl border border-[#dfe3f2] bg-white pl-12 pr-12 text-sm text-[#131b42] outline-none transition placeholder:text-[#8994b1] focus:border-[#5745ec] focus:ring-4 focus:ring-[#e8e5ff]'

export default function LoginPage() {
  const { user, isLoading, authError, login } = useAuth()
  const toast = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [forgot, setForgot] = useState(false)
  const [sent, setSent] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [sending, setSending] = useState(false)
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<LoginValues>()
  const [resetEmail, setResetEmail] = useState('')
  useEffect(() => { if (authError) toast.error(authError, 'Tizimga ulanish imkoni bo‘lmadi') }, [authError, toast])
  if (isLoading) return <PageLoader label="Tizimga ulanmoqda..." />
  if (user) return <Navigate to={`/${user.role}/dashboard`} replace />
  async function onSubmit(values: LoginValues) {
    try { await login(values.email, values.password, remember) } catch (error) { toast.error(error instanceof Error ? error.message : 'Tizimga kirib bo‘lmadi.') }
  }
  async function requestReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSending(true); setRequestError('')
    try { await api('/auth/forgot-password', { method: 'POST', auth: false, body: JSON.stringify({ email: resetEmail.trim() }) }); setSent(true) }
    catch (error) { setRequestError(error instanceof Error ? error.message : 'So‘rovni yuborib bo‘lmadi.') } finally { setSending(false) }
  }
  function openForgot() { setResetEmail(getValues('email') || ''); setSent(false); setRequestError(''); setForgot(true) }
  return <main className="theme-fixed min-h-dvh bg-[#f3f4fd] text-[#11183e] lg:grid lg:grid-cols-2">
    <section className="relative flex min-h-[300px] flex-col overflow-hidden rounded-b-[3.5rem] text-white lg:min-h-dvh lg:rounded-b-none lg:rounded-r-[14rem]">
      <img src={campus} alt="OXU universiteti binosi" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#11183a]/45 via-transparent to-[#252d80]/25" />
      <div className="relative z-10 flex items-center gap-3 px-6 pt-6 sm:px-10 lg:px-[10%] lg:pt-10"><span className="grid size-12 place-items-center rounded-2xl bg-[#4938d9] shadow-lg"><AccountBalanceRoundedIcon sx={{ fontSize: 28 }} /></span><span className="text-2xl font-extrabold tracking-tight">OXU Digital</span></div>
      <div className="relative z-10 mt-auto overflow-hidden bg-[#404eae]/95 px-6 pb-9 pt-9 sm:px-10 sm:pt-10 lg:mr-[5%] lg:rounded-tr-[12rem] lg:px-[10%] lg:pb-12 lg:pt-14">
        <h1 className="max-w-lg text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl xl:text-[2.7rem]">Universitet boshqaruvi<br />bir platformada</h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-indigo-100 sm:text-base">Ta’lim jarayonlari, talabalar, guruhlar, davomat va ko‘proq imkoniyatlar — OXU Digital’da.</p>
        <div className="mt-8 hidden grid-cols-3 gap-5 sm:grid">{features.map((feature, index) => <div key={index}><span className="grid size-12 place-items-center rounded-2xl bg-white/20 text-white">{feature.icon}</span><p className="mt-3 text-sm font-semibold leading-5">{feature.text}</p></div>)}</div>
      </div>
    </section>
    <section className="relative flex items-center justify-center overflow-hidden px-5 py-10 sm:px-10 lg:min-h-dvh lg:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-24 size-80 rounded-full bg-[#dedbff]/70" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-1/3 size-64 rounded-full border-[32px] border-[#e8e7ff]/70" />
      <div className="relative w-full max-w-[570px] rounded-[2rem] bg-white px-6 py-8 shadow-[0_22px_70px_-32px_rgba(67,55,150,.25)] sm:px-12 sm:py-11">
        <div className="flex items-center justify-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-[#4938d9] text-white shadow-md"><AccountBalanceRoundedIcon sx={{ fontSize: 28 }} /></span><span className="text-2xl font-extrabold tracking-tight text-[#101745]">OXU Digital</span></div>
        {!forgot ? <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <h2 className="mt-8 text-center text-3xl font-extrabold tracking-tight text-[#101745] sm:text-4xl">Tizimga kirish</h2><p className="mt-3 text-center text-sm leading-6 text-[#687697]">OXU Digital boshqaruv platformasiga xush kelibsiz!</p>
          <div className="mt-8 space-y-5"><div><label htmlFor="login-email" className="text-sm font-bold">Email manzil</label><div className="relative mt-2"><MailOutlineRoundedIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#687697]" sx={{ fontSize: 20 }} /><input id="login-email" className={fieldClass} type="email" autoComplete="username" placeholder="Email manzilni kiriting" aria-invalid={Boolean(errors.email)} {...register('email', { required: 'Email manzilni kiriting.', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email manzil formati noto‘g‘ri.' } })} /></div>{errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}</div>
          <div><label htmlFor="login-password" className="text-sm font-bold">Parol</label><div className="relative mt-2"><LockOutlinedIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#687697]" sx={{ fontSize: 20 }} /><input id="login-password" className={fieldClass} type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Parolni kiriting" aria-invalid={Boolean(errors.password)} {...register('password', { required: 'Parolni kiriting.' })} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'} className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-[#687697] hover:bg-slate-100">{showPassword ? <VisibilityOffOutlinedIcon sx={{ fontSize: 20 }} /> : <VisibilityOutlinedIcon sx={{ fontSize: 20 }} />}</button></div>{errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>}</div></div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm"><label className="flex cursor-pointer items-center gap-2 font-medium text-[#34415f]"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="size-4 accent-[#4b38df]" />Meni eslab qolish</label><button type="button" onClick={openForgot} className="font-semibold text-[#4936e9] hover:underline">Parolni unutdingizmi?</button></div>
          <button type="submit" disabled={isSubmitting} className="mt-7 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#6957ef] to-[#4030ce] text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:brightness-110 disabled:opacity-60"><LoginRoundedIcon sx={{ fontSize: 20 }} />{isSubmitting ? 'Tekshirilmoqda...' : 'Kirish'}</button>
          <p className="mt-7 text-center text-xs text-slate-400">Kirish ma’lumotlarini administratoringizdan oling.</p>
        </form> : <div><button type="button" onClick={() => setForgot(false)} className="mt-8 inline-flex items-center gap-1 text-sm font-semibold text-[#4936e9] hover:underline"><ArrowBackRoundedIcon sx={{ fontSize: 18 }} /> Kirishga qaytish</button><h2 className="mt-5 text-2xl font-extrabold text-[#101745]">Parolni tiklash</h2><p className="mt-3 text-sm leading-6 text-[#687697]">Hisobingiz emailini kiriting. Agar hisobingizga Telegram ulangan bo‘lsa, tiklash havolasi o‘sha yerga yuboriladi.</p>
          {sent ? <div role="status" className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">Agar faol hisobingiz Telegramga ulangan bo‘lsa, tiklash havolasi yuborildi. Telegramingizni tekshiring. Havola 20 daqiqa amal qiladi.<p className="mt-2">Telegram ulanmagan bo‘lsa, administratorga murojaat qiling.</p></div> : <form onSubmit={requestReset} className="mt-6"><label htmlFor="reset-email" className="text-sm font-bold">Email manzil</label><div className="relative mt-2"><MailOutlineRoundedIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#687697]" sx={{ fontSize: 20 }} /><input id="reset-email" required type="email" autoComplete="email" className={fieldClass} placeholder="Email manzilni kiriting" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} /></div>{requestError && <p role="alert" className="mt-3 text-sm text-rose-700">{requestError}</p>}<button disabled={sending} className="mt-6 h-14 w-full rounded-2xl bg-gradient-to-r from-[#6957ef] to-[#4030ce] text-sm font-bold text-white disabled:opacity-60">{sending ? 'Yuborilmoqda...' : 'Telegramga havola yuborish'}</button></form>}
        </div>}
      </div>
    </section>
  </main>
}
