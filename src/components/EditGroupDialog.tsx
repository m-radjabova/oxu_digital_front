import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import { useForm, useWatch } from 'react-hook-form'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import type { Direction, Group } from '../types'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { FormField } from './ui/Field'
import { inputClass } from './ui/fieldStyles'

export interface GroupValues {
  name: string; year: number; directionId: string
  educationForm: 'full-time' | 'evening' | 'part-time'
  admissionYear: number; studentLimit: number; isActive: boolean
}

export default function EditGroupDialog({ group, directions, busy = false, onClose, onSave }: {
  group?: Group; directions: Direction[]; busy?: boolean; onClose: () => void; onSave: (values: GroupValues, assignSubjects?: boolean) => void | Promise<void>
}) {
  const initialDirection = directions.find((item) => item.id === group?.direction?.id)
  const { register, handleSubmit, control, setValue, formState: { errors, isSubmitting } } = useForm<GroupValues & { facultyId: string; departmentId: string }>({
    defaultValues: { name: group?.name || '', year: group?.year || 1, directionId: group?.direction?.id || '', educationForm: group?.educationForm || 'full-time', admissionYear: group?.admissionYear || new Date().getFullYear(), studentLimit: group?.studentLimit || 30, isActive: group?.isActive !== false, facultyId: initialDirection?.department?.faculty?.id || '', departmentId: initialDirection?.department?.id || '' },
  })
  const values = useWatch({ control })
  const faculties = [...new Map(directions.filter((d) => d.isActive !== false && d.department?.faculty).map((d) => [d.department.faculty.id, d.department.faculty])).values()]
  const departments = [...new Map(directions.filter((d) => d.isActive !== false && d.department?.faculty?.id === values.facultyId).map((d) => [d.department.id, d.department])).values()]
  const availableDirections = directions.filter((d) => d.isActive !== false && d.department?.id === values.departmentId)
  const pending = busy || isSubmitting
  const close = () => { if (!pending) onClose() }
  const submitValues = (v: GroupValues, assignSubjects = false) => onSave({ name: v.name.trim(), year: v.year, directionId: v.directionId, educationForm: v.educationForm, admissionYear: v.admissionYear, studentLimit: v.studentLimit, isActive: v.isActive }, assignSubjects)
  return <Modal open onClose={close} size="wide" placement="right" title={group ? 'Guruhni tahrirlash' : 'Guruh qo‘shish'} description="Guruh ma’lumotlari va boshlang‘ich parametrlarini sozlang." icon={<GroupsRoundedIcon />}>
    <form onSubmit={handleSubmit((v) => submitValues(v))} className="flex min-h-full flex-col" noValidate>
      <div className="grid flex-1 items-start gap-5 p-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)] sm:p-7">
        <section className="rounded-2xl border border-slate-200 bg-surface p-5"><h3 className="mb-5 text-lg font-bold text-slate-900">Guruh ma’lumotlarini kiriting</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField icon={<AccountBalanceRoundedIcon />} label="Fakultet" required><select className={inputClass} disabled={pending} {...register('facultyId', { required: true, onChange: () => { setValue('departmentId', ''); setValue('directionId', '') } })}><option value="">Fakultetni tanlang</option>{faculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select>{errors.facultyId && <span className="text-xs text-rose-600">Fakultetni tanlang.</span>}</FormField>
            <FormField icon={<AccountTreeRoundedIcon />} label="Kafedra" required><select className={inputClass} disabled={pending || !values.facultyId} {...register('departmentId', { required: true, onChange: () => setValue('directionId', '') })}><option value="">Kafedrani tanlang</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>{errors.departmentId && <span className="text-xs text-rose-600">Kafedrani tanlang.</span>}</FormField>
            <FormField icon={<SchoolRoundedIcon />} label="Yo‘nalish" required error={errors.directionId?.message}><select className={inputClass} disabled={pending || !values.departmentId} {...register('directionId', { required: 'Yo‘nalishni tanlang.' })}><option value="">Yo‘nalishni tanlang</option>{availableDirections.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></FormField>
            <FormField icon={<MenuBookRoundedIcon />} label="Ta’lim shakli" required><select className={inputClass} disabled={pending} {...register('educationForm')}><option value="full-time">Kunduzgi</option><option value="evening">Kechki</option><option value="part-time">Sirtqi</option></select></FormField>
            <FormField icon={<GroupsRoundedIcon />} label="Guruh nomi" required error={errors.name?.message}><input className={inputClass} placeholder="Masalan, S1-KT-26" disabled={pending} {...register('name', { validate: (v) => !!v.trim() || 'Guruh nomini kiriting.', maxLength: 80 })} /></FormField>
            <FormField icon={<CalendarTodayRoundedIcon />} label="Qabul yili" required error={errors.admissionYear?.message}><input type="number" className={inputClass} disabled={pending} {...register('admissionYear', { valueAsNumber: true, required: 'Qabul yilini kiriting.', min: { value: 1900, message: 'Yilni tekshiring.' }, max: { value: 2100, message: 'Yilni tekshiring.' } })} /></FormField>
            <FormField icon={<SchoolRoundedIcon />} label="Bosqich" required><select className={inputClass} disabled={pending} {...register('year', { valueAsNumber: true })}>{[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n}-kurs</option>)}</select></FormField>
            <FormField icon={<PersonOutlineRoundedIcon />} label="Talaba limiti" required error={errors.studentLimit?.message}><input type="number" className={inputClass} disabled={pending} {...register('studentLimit', { valueAsNumber: true, required: 'Limitni kiriting.', min: { value: 1, message: 'Kamida 1 ta bo‘lishi kerak.' }, max: { value: 500, message: '500 tadan oshmasin.' } })} /></FormField>
          </div>
          <label className="mt-5 flex items-center gap-3 text-sm font-semibold text-slate-700"><input type="checkbox" className="size-5 accent-brand-600" disabled={pending} {...register('isActive')} />Faol holat</label>
          <p className="mt-5 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">Guruh yaratilgandan so‘ng unga mos fanlarni biriktirish mumkin.</p>
        </section>
        <aside className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-brand-50 p-5"><div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><SchoolRoundedIcon /></span><div><h3 className="font-bold text-slate-900">Guruh ma’lumotlari</h3><p className="text-xs text-slate-500">Yaratilayotgan guruh ko‘rsatkichlari</p></div></div><div className="mt-5 divide-y divide-slate-200 rounded-xl bg-surface p-4 text-sm">{[['Guruh nomi', values.name || '—'], ['Bosqich', `${values.year || 1}-kurs`], ['Talaba limiti', String(values.studentLimit || 0)], ['Holat', values.isActive ? 'Faol' : 'Nofaol']].map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-3"><span className="text-slate-500">{label}</span><b className="text-right text-slate-800">{value}</b></div>)}</div></aside>
      </div>
      {!group && <div className="mx-5 mb-5 rounded-2xl border border-slate-200 bg-surface p-5 sm:mx-7"><h3 className="font-bold text-slate-900">Keyingi amallar</h3><p className="mt-1 text-xs text-slate-500">Guruh yaratilgandan so‘ng bajariladigan amallar</p><div className="mt-4 grid gap-3 sm:grid-cols-3">{[['1', 'Guruh yaratish', 'Guruhni tizimga qo‘shish'], ['2', 'Fan biriktirish', 'Mos fanlarni guruhga biriktirish'], ['3', 'Darslarni taqsimlash', 'Dars jadvalini tuzish']].map(([number, title, description]) => <div key={number} className="flex items-center gap-3 rounded-xl bg-brand-50 p-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">{number}</span><span><b className="block text-sm text-slate-800">{title}</b><small className="text-xs text-slate-500">{description}</small></span></div>)}</div></div>}
      <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-surface p-4 sm:px-7"><Button variant="secondary" disabled={pending} onClick={close}>Bekor qilish</Button><Button type="submit" loading={pending} loadingText="Saqlanmoqda...">Saqlash</Button>{!group && <Button variant="secondary" disabled={pending || !values.isActive} onClick={() => void handleSubmit((v) => submitValues(v, true))()}>Saqlash va fan biriktirish</Button>}</div>
    </form>
  </Modal>
}
