import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import type { Direction, Group, Subject } from '../types'
import type { UserInput } from '../hooks/usePaginatedUsers'
import useToast from '../hooks/useToast'
import Modal from './ui/Modal'
import Button from './ui/Button'
import MultiSelect from './ui/MultiSelect'
import { FormField } from './ui/Field'
import { inputBase, inputClass, selectClass } from './ui/fieldStyles'

interface AccountValues {
  name: string
  email: string
  password: string
  role: 'teacher' | 'student'
  groupId: string
}

interface Credentials {
  name: string
  email: string
  password: string
}

export default function CreateAccountDialog({
  groups,
  subjects,
  directions,
  onClose,
  onCreate,
}: {
  groups: Group[]
  subjects: Subject[]
  directions: Direction[]
  onClose: () => void
  onCreate: (values: UserInput) => Promise<unknown>
}) {
  const toast = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [subjectIds, setSubjectIds] = useState<string[]>([])
  const [directionIds, setDirectionIds] = useState<string[]>([])
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AccountValues>({ defaultValues: { name: '', email: '', password: '', role: 'teacher', groupId: '' } })

  const role = useWatch({ control, name: 'role' }) || 'teacher'
  const activeGroups = groups.filter((group) => group.isActive !== false)

  function handleClose() {
    if (isSubmitting) return
    onClose()
  }

  function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
    const values = new Uint32Array(10)
    crypto.getRandomValues(values)
    setValue('password', Array.from(values, (value) => chars[value % chars.length]).join(''), { shouldValidate: true })
    setShowPassword(true)
  }

  async function copyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} nusxalandi.`, 'Nusxalandi')
    } catch {
      toast.error('Nusxalab bo‘lmadi. Brauzer ruxsatini tekshiring.')
    }
  }

  async function submit(values: AccountValues) {
    if (values.role === 'teacher' && !directionIds.length) {
      setError('root', { type: 'manual', message: 'O‘qituvchi uchun kamida bitta yo‘nalishni tanlang.' })
      return
    }
    if (values.role === 'student' && !values.groupId) {
      setError('groupId', { type: 'manual', message: 'Talaba uchun guruh tanlang.' })
      return
    }

    try {
      await onCreate({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role,
        groupId: values.role === 'student' ? values.groupId : undefined,
        subjectIds: values.role === 'teacher' ? subjectIds : undefined,
        directionIds: values.role === 'teacher' ? directionIds : undefined,
      })
      setCredentials({ name: values.name.trim(), email: values.email.trim(), password: values.password })
      toast.success('Yangi hisob muvaffaqiyatli yaratildi.', 'Hisob qo‘shildi')
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Hisob yaratib bo‘lmadi.')
    }
  }

  function startAnother() {
    reset({ name: '', email: '', password: '', role, groupId: '' })
    setSubjectIds([])
    setDirectionIds([])
    setShowPassword(false)
    setCredentials(null)
  }

  if (credentials) {
    return (
      <Modal open onClose={onClose} size="lg" placement="right" ariaLabel="Hisob yaratildi">
        <div className="flex min-h-0 flex-1 flex-col justify-between">
          <div className="my-auto px-6 py-8 text-center sm:px-8">
            <span className="relative mx-auto grid size-20 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
              <CheckCircleRoundedIcon sx={{ fontSize: 42 }} />
            </span>
            <h2 className="mt-5 text-2xl font-bold text-slate-900">Hisob muvaffaqiyatli yaratildi</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              <b className="font-semibold text-slate-700">{credentials.name}</b> uchun kirish ma’lumotlari tayyorlandi.
            </p>
            <div className="mx-auto mt-6 max-w-lg grid gap-3 text-left">
              <CredentialRow label="Login" value={credentials.email} onCopy={() => void copyValue(credentials.email, 'Login')} />
              <CredentialRow label="Parol" value={credentials.password} onCopy={() => void copyValue(credentials.password, 'Parol')} />
              <p className="mt-2 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs leading-5 text-amber-800">
                <WarningAmberRoundedIcon sx={{ fontSize: 18 }} className="mt-0.5 shrink-0" />
                <span>Parol boshqa ko‘rsatilmaydi. Uni hisob egasiga xavfsiz usulda yetkazing.</span>
              </p>
            </div>
          </div>
          <div className="sticky bottom-0 flex flex-wrap justify-end gap-2.5 border-t border-slate-100 bg-surface/95 px-6 py-4 backdrop-blur sm:px-8">
            <Button variant="secondary" startIcon={<PersonAddAltRoundedIcon sx={{ fontSize: 17 }} />} onClick={startAnother}>
              Yana qo‘shish
            </Button>
            <Button onClick={onClose}>Tayyor</Button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open
      onClose={handleClose}
      size="lg"
      placement="right"
      eyebrow="Foydalanuvchilar"
      title="Yangi hisob"
      description="O‘qituvchi yoki talaba uchun kirish ma’lumotlarini yarating. Parol xavfsiz xeshlangan holda saqlanadi."
      icon={<PersonAddAltRoundedIcon />}
    >
      <form onSubmit={handleSubmit(submit)} className="flex min-h-0 flex-1 flex-col justify-between" noValidate>
        <div className="grid gap-5 px-6 py-6 sm:px-8 sm:py-7">
          <div>
            <span className="block text-[13px] font-semibold text-slate-700">Foydalanuvchi turi</span>
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Foydalanuvchi turi">
              <RoleOption
                active={role === 'teacher'}
                tone="text-brand-700"
                icon={<SchoolRoundedIcon sx={{ fontSize: 17 }} />}
                label="O‘qituvchi"
                disabled={isSubmitting}
                onClick={() => { setValue('role', 'teacher'); clearErrors() }}
              />
              <RoleOption
                active={role === 'student'}
                tone="text-amber-700"
                icon={<PeopleAltRoundedIcon sx={{ fontSize: 17 }} />}
                label="Talaba"
                disabled={isSubmitting}
                onClick={() => { setValue('role', 'student'); clearErrors() }}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="F.I.Sh." htmlFor="create-account-name" required error={errors.name?.message}>
              <input
                id="create-account-name"
                className={inputClass}
                placeholder="Masalan, Dilnoza Karimova"
                autoComplete="off"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.name)}
                {...register('name', {
                  validate: (value) => Boolean(value.trim()) || 'Ismni kiriting.',
                  maxLength: { value: 100, message: 'Ism juda uzun.' },
                })}
              />
            </FormField>

            <FormField label="Email manzil" htmlFor="create-account-email" required error={errors.email?.message}>
              <input
                id="create-account-email"
                className={inputClass}
                type="email"
                inputMode="email"
                placeholder="name@oxu.uz"
                autoComplete="off"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.email)}
                {...register('email', {
                  required: 'Emailni kiriting.',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email formati noto‘g‘ri.' },
                })}
              />
            </FormField>
          </div>

          <FormField
            label="Vaqtinchalik parol"
            htmlFor="create-account-password"
            required
            error={errors.password?.message}
            hint="Kamida 8 ta belgi. Parol faqat bir marta ko‘rsatiladi."
          >
            <div className="relative mt-2">
              <input
                id="create-account-password"
                className={`${inputBase} h-12 pr-24`}
                type={showPassword ? 'text' : 'password'}
                placeholder="Kamida 8 ta belgi"
                autoComplete="new-password"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.password)}
                {...register('password', {
                  required: 'Parolni kiriting.',
                  minLength: { value: 8, message: 'Parol kamida 8 ta belgidan iborat bo‘lsin.' },
                })}
              />
              <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 gap-0.5">
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} /> : <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />}
                </button>
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-brand-700"
                  aria-label="Tasodifiy parol yaratish"
                  title="Tasodifiy parol yaratish"
                  onClick={generatePassword}
                >
                  <AutorenewRoundedIcon sx={{ fontSize: 18 }} />
                </button>
              </div>
            </div>
          </FormField>

          {role === 'teacher' && (
            <>
              <FormField icon={<MenuBookRoundedIcon />}
                label="Yo‘nalishlar"
                required
                error={errors.root?.message}
                hint="O‘qituvchi bir nechta yo‘nalishda dars berishi mumkin."
              >
                <MultiSelect
                  options={directions.map((direction) => ({
                    id: direction.id,
                    label: `${direction.name} · ${direction.department.name}`,
                  }))}
                  value={directionIds}
                  onChange={(next) => { setDirectionIds(next); if (next.length) clearErrors('root') }}
                  placeholder="Yo‘nalishlarni tanlang"
                  emptyText="Yo‘nalishlar mavjud emas. Avval Fakultet va yo‘nalishlar bo‘limida yarating."
                  disabled={isSubmitting}
                  ariaLabel="O‘qituvchi yo‘nalishlari"
                />
              </FormField>

              <FormField
                label="Fanlar"
                hint={
                  subjects.length
                    ? 'Bir nechta fanni tanlang — o‘qituvchi faqat shu fanlarga dars biriktira oladi.'
                    : 'Fanlar mavjud emas. Avval Fanlar bo‘limida fan yarating.'
                }
              >
                <MultiSelect
                  options={subjects.map((subject) => ({ id: subject.id, label: subject.name }))}
                  value={subjectIds}
                  onChange={setSubjectIds}
                  placeholder="Fanlarni tanlang"
                  emptyText="Fanlar mavjud emas."
                  disabled={isSubmitting}
                  ariaLabel="O‘qituvchi fanlari"
                />
              </FormField>
            </>
          )}

          {role === 'student' && (
            <FormField icon={<GroupsRoundedIcon />} label="Guruh" htmlFor="create-account-group" required error={errors.groupId?.message}>
              <select
                id="create-account-group"
                className={selectClass}
                aria-invalid={Boolean(errors.groupId)}
                disabled={isSubmitting || activeGroups.length === 0}
                {...register('groupId')}
              >
                <option value="">Guruhni tanlang</option>
                {activeGroups.map((group) => <option value={group.id} key={group.id}>{group.name}</option>)}
              </select>
            </FormField>
          )}

          {role === 'student' && activeGroups.length === 0 && (
            <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              <WarningAmberRoundedIcon sx={{ fontSize: 16 }} className="mt-0.5 shrink-0" />
              {groups.length ? (
                <span>Barcha guruhlar nofaol. Talaba biriktirish uchun avval <Link className="font-bold underline underline-offset-2" to="/admin/groups">Guruhlar</Link> bo‘limida guruhni faollashtiring.</span>
              ) : (
                <span>Guruh mavjud emas. Avval <Link className="font-bold underline underline-offset-2" to="/admin/groups">Guruhlar</Link> bo‘limida guruh yarating.</span>
              )}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 mt-auto flex flex-wrap justify-end gap-2.5 border-t border-slate-100 bg-surface/95 px-6 py-4 backdrop-blur sm:px-8">
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Bekor qilish
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            loadingText="Saqlanmoqda..."
            disabled={role === 'student' && activeGroups.length === 0}
            startIcon={<PersonAddAltRoundedIcon sx={{ fontSize: 18 }} />}
          >
            Hisob yaratish
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function RoleOption({
  active,
  tone,
  icon,
  label,
  disabled,
  onClick,
}: {
  active: boolean
  tone: string
  icon: ReactNode
  label: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition disabled:opacity-60 ${
        active ? `bg-surface ${tone} shadow-sm ring-1 ring-slate-200` : 'text-slate-500 hover:text-slate-700'
      }`}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  )
}

function CredentialRow({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 ring-1 ring-inset ring-slate-200/70">
      <span className="min-w-0 text-left">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <span className="block truncate font-mono text-sm font-bold text-slate-800">{value}</span>
      </span>
      <button
        type="button"
        className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-brand-50 hover:text-brand-700"
        aria-label={`${label}ni nusxalash`}
        title={`${label}ni nusxalash`}
        onClick={onCopy}
      >
        <ContentCopyRoundedIcon sx={{ fontSize: 16 }} />
      </button>
    </div>
  )
}
