import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import { api } from '../lib/api'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const [token] = useState(() => params.get('token') || '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('')
    if (password.length < 8) { setError('Parol kamida 8 belgidan iborat bo‘lishi kerak.'); return }
    if (password !== confirm) { setError('Parollar bir-biriga mos emas.'); return }
    setBusy(true)
    try { await api('/auth/reset-password', { method: 'POST', auth: false, body: JSON.stringify({ token, password }) }); window.history.replaceState(null, '', '/reset-password'); setDone(true); setPassword(''); setConfirm('') }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Parolni yangilab bo‘lmadi.') } finally { setBusy(false) }
  }
  return <main className="theme-fixed flex min-h-dvh items-center justify-center bg-[#f3f4fd] px-5 py-10 text-[#101745]"><div className="w-full max-w-md rounded-[2rem] bg-white p-7 shadow-xl shadow-indigo-100/70 sm:p-10"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#4938d9] text-white"><AccountBalanceRoundedIcon /></span><span className="text-xl font-extrabold">OXU Digital</span></div><h1 className="mt-8 text-2xl font-extrabold">Yangi parol o‘rnating</h1>{done ? <div role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">Parolingiz yangilandi. Endi yangi parol bilan kirishingiz mumkin.</div> : <><p className="mt-2 text-sm leading-6 text-slate-500">Parol kamida 8 belgidan iborat bo‘lsin. Havoladan faqat bir marta foydalanish mumkin.</p><form className="mt-6 space-y-4" onSubmit={submit}><label className="block text-sm font-bold">Yangi parol<input type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></label><label className="block text-sm font-bold">Parolni tasdiqlang<input type="password" autoComplete="new-password" required value={confirm} onChange={(event) => setConfirm(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></label>{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}{!token && <p role="alert" className="text-sm text-rose-700">Tiklash havolasi topilmadi. Yangi havola so‘rang.</p>}<button disabled={busy || !token} className="h-12 w-full rounded-xl bg-[#4938d9] font-bold text-white disabled:opacity-60">{busy ? 'Saqlanmoqda...' : 'Parolni yangilash'}</button></form></>}<Link to="/login" className="mt-6 inline-block text-sm font-semibold text-indigo-700 hover:underline">Kirish sahifasiga qaytish</Link></div></main>
}
