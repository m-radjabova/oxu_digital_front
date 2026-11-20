import LockRoundedIcon from '@mui/icons-material/LockRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import type { Direction, Group, Subject, User } from '../types'
import type { UserUpdateInput } from '../hooks/usePaginatedUsers'
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
  directionIds: string[]
}

export default function EditAccountDialog({
  account,
  groups,
  subjects,
  directions,
  busy = false,
  onClose,
  onSave,
}: {
  account: User
  groups: Group[]
  subjects: Subject[]
  directions: Direction[]
  busy?: boolean
  onClose: () => void
  onSave: (values: UserUpdateInput) => void | Promise<void>
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [subjectIds, setSubjectIds] = useState<string[]>(account.subjectIds || [])
  const [directionIds, setDirectionIds] = useState<string[]>(account.directionIds || [])
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AccountValues>({
    defaultValues: {
      name: account.name,
      email: account.email,
      password: '',
      role: account.role === 'student' ? 'student' : 'teacher',
      groupId: account.group?.id || '',
    },
  })

  const role = useWatch({ control, name: 'role' }) || 'teacher'
  const pending = busy || isSubmitting
  const roleChanged = role !== account.role

  function handleClose() {
    if (pending) return
    onClose()
  }

  async function submit(values: AccountValues) {
    if (values.role === 'teacher' && !directionIds.length) {
      setError('directionIds', { type: 'manual', message: 'Kamida bitta yo‘nalishni tanlang.' })
      return
    }
    if (values.role === 'student' && !values.groupId) {
      setError('groupId', { type: 'manual', message: 'Talaba uchun guruh tanlang.' })
      return
    }

    await onSave({
      name: values.name,
      email: values.email,
      role: values.role,
      groupId: values.role === 'student' ? values.groupId : undefined,
      password: values.password ? values.password : undefined,
      subjectIds: values.role === 'teacher' ? subjectIds : [],
      directionIds: values.role === 'teacher' ? directionIds : [],
    })
  }

  return (
    <Modal
      open
      onClose={handleClose}
      size="lg"
      placement="right"
      eyebrow="Hisobni tahrirlash"
      title={account.name}
      description="Ism, login yoki rolni yangilang. Parolni bo‘sh qoldirsangiz u o‘zgarmaydi."
      icon={<ManageAccountsRoundedIcon />}
    >
      <form onSubmit={handleSubmit(submit)} className="flex min-h-0 flex-1 flex-col justify-between" noValidate>
        <div className="grid gap-5 px-6 py-6 sm:px-8 sm:py-7">
          <FormField label="F.I.Sh." htmlFor="edit-account-name" required error={errors.name?.message}>
            <input
              id="edit-account-name"
              className={inputClass}
              placeholder="Masalan, Dilnoza Karimova"
              autoComplete="off"
              disabled={pending}
              {...register('name', {
                required: 'Ismni kiriting.',
                maxLength: { value: 100, message: 'Ism juda uzun.' },
              })}
            />
          </FormField>

          <FormField label="Email manzil" htmlFor="edit-account-email" required error={errors.email?.message}>
            <input
              id="edit-account-email"
              className={inputClass}
              type="email"
              inputMode="email"
              placeholder="name@oxu.uz"
              autoComplete="off"
              disabled={pending}
              {...register('email', {
                required: 'Emailni kiriting.',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email formati noto‘g‘ri.' },
              })}
            />
          </FormField>

          <FormField icon={<LockRoundedIcon />}
            label="Yangi parol"
            htmlFor="edit-account-password"
            error={errors.password?.message}
            hint="Ixtiyoriy — bo‘sh qoldirsangiz joriy parol saqlanadi."
          >
            <div className="relative mt-2">
              <input
                id="edit-account-password"
                className={`${inputBase} h-12 pr-12`}
                type={showPassword ? 'text' : 'password'}
                placeholder="Kamida 8 ta belgi"
                autoComplete="new-password"
                disabled={pending}
                {...register('password', {
                  validate: (value) => !value || value.length >= 8 || 'Parol kamida 8 ta belgidan iborat bo‘lsin.',
                })}
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} /> : <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />}
                </button>
              </div>
            </div>
          </FormField>

          <div>
            <span className="block text-[13px] font-semibold text-slate-700">Foydalanuvchi turi</span>
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Foydalanuvchi turi">
              <button
                type="button"
                aria-pressed={role === 'teacher'}
                disabled={pending}
                className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition disabled:opacity-60 ${
                  role === 'teacher' ? 'bg-surface text-brand-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setValue('role', 'teacher')}
              >
                <SchoolRoundedIcon sx={{ fontSize: 17 }} />
                O‘qituvchi
              </button>
              <button
                type="button"
                aria-pressed={role === 'student'}
                disabled={pending}
                className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition disabled:opacity-60 ${
                  role === 'student' ? 'bg-surface text-amber-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setValue('role', 'student')}
              >
                <PeopleAltRoundedIcon sx={{ fontSize: 17 }} />
                Talaba
              </button>
            </div>
          </div>

          {roleChanged && (
            <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              <WarningAmberRoundedIcon sx={{ fontSize: 16 }} className="mt-0.5 shrink-0" />
              <span>
                {account.role === 'teacher'
                  ? 'Rol talabaga o‘zgartirilsa, bu o‘qituvchining jadvaldagi darslari va band vaqtlari o‘chiriladi hamda biriktirilgan fanlar tozalanadi.'
                  : 'Rol o‘qituvchiga o‘zgartirilsa, talaba guruhdan chiqariladi.'}
              </span>
            </p>
          )}

          {role === 'teacher' && (
            <FormField icon={<MenuBookRoundedIcon />}
              label="Yo‘nalishlar"
              error={errors.directionIds?.message}
              hint="O‘qituvchi bir nechta yo‘nalishda dars berishi mumkin."
            >
              <MultiSelect
                options={directions.map((direction) => ({
                  id: direction.id,
                  label: `${direction.name} · ${direction.department.name}`,
                }))}
                value={directionIds}
                onChange={setDirectionIds}
                placeholder="Yo‘nalishlarni tanlang"
                emptyText="Yo‘nalishlar mavjud emas."
                disabled={pending}
                ariaLabel="O‘qituvchi yo‘nalishlari"
              />
            </FormField>
          )}

          {role === 'teacher' && (
            <FormField icon={<GroupsRoundedIcon />}
              label="Fanlar"
              hint="Bir nechta fanni tanlang — dars biriktirishda faqat shu fanlar ko‘rinadi."
            >
              <MultiSelect
                options={subjects.map((subject) => ({ id: subject.id, label: subject.name }))}
                value={subjectIds}
                onChange={setSubjectIds}
                placeholder="Fanlarni tanlang"
                emptyText="Fanlar mavjud emas."
                disabled={pending}
                ariaLabel="O‘qituvchi fanlari"
              />
            </FormField>
          )}

          {role === 'student' && (
            <FormField
              label="Guruh"
              required
              error={errors.groupId?.message}
              hint={groups.some((group) => group.isActive === false) ? 'Nofaol guruhlar yangi biriktirish uchun tanlanmaydi.' : undefined}
            >
              <select
                className={selectClass}
                aria-invalid={Boolean(errors.groupId)}
                disabled={pending}
                {...register('groupId')}
              >
                <option value="">Guruhni tanlang</option>
                {groups.map((group) => {
                  const isCurrent = group.id === account.group?.id
                  const isInactive = group.isActive === false
                  return (
                    <option value={group.id} key={group.id} disabled={isInactive && !isCurrent}>
                      {group.name}{isInactive ? ' · nofaol' : ''}
                    </option>
                  )
                })}
              </select>
            </FormField>
          )}

          {role === 'student' && groups.length === 0 && (
            <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              <WarningAmberRoundedIcon sx={{ fontSize: 16 }} className="mt-0.5 shrink-0" />
              <span>Guruh mavjud emas. Avval <Link className="font-bold underline underline-offset-2" to="/admin/groups">Guruhlar</Link> bo‘limida guruh yarating.</span>
            </p>
          )}
        </div>

        <div className="sticky bottom-0 mt-auto flex flex-wrap justify-end gap-2.5 border-t border-slate-100 bg-surface/95 px-6 py-4 backdrop-blur sm:px-8">
          <Button variant="secondary" onClick={handleClose} disabled={pending}>
            Bekor qilish
          </Button>
          <Button type="submit" loading={pending} loadingText="Saqlanmoqda...">
            Saqlash
          </Button>
        </div>
      </form>
    </Modal>
  )
}
