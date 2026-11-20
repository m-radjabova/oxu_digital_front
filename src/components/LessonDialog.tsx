import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded'
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import DateRangeRoundedIcon from '@mui/icons-material/DateRangeRounded'
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { api } from '../lib/api'
import { subscribeToRealtime } from '../lib/realtime'
import type { Building, Group, Lesson, LessonType, RoomKind, Subject, User } from '../types'
import type { LessonInput } from '../hooks/useLessons'
import {
  busyGroupIdsAtSlot,
  lessonGroupNames,
  LESSON_TYPES,
  MAX_LECTURE_GROUPS,
} from '../utils/lessons'
import Modal from './ui/Modal'
import ConfirmDialog from './ui/ConfirmDialog'
import Button from './ui/Button'
import Badge from './ui/Badge'
import MultiSelect from './ui/MultiSelect'
import { FormField } from './ui/Field'
import { selectClass } from './ui/fieldStyles'

const DAYS = [
  { value: 1, label: 'Dushanba' }, { value: 2, label: 'Seshanba' },
  { value: 3, label: 'Chorshanba' }, { value: 4, label: 'Payshanba' },
  { value: 5, label: 'Juma' }, { value: 6, label: 'Shanba' },
]

type SubjectLoadSummary = { groupId: string; types: { type: LessonType; allocated: number; planned: number; remaining: number; completed: number }[] }

export default function LessonDialog({
  day,
  period,
  weekStart,
  weekLabel,
  lesson,
  initialTeacherId,
  initialGroupId,
  groups,
  subjects,
  teachers,
  lessons,
  busy = false,
  isPastOrToday = false,
  onClose,
  onSave,
  onDelete,
}: {
  day: number
  period: number
  weekStart: string
  weekLabel?: string
  lesson?: Lesson
  initialTeacherId?: string
  initialGroupId?: string
  groups: Group[]
  subjects: Subject[]
  teachers: User[]
  lessons: Lesson[]
  busy?: boolean
  isPastOrToday?: boolean
  onClose: () => void
  onSave: (values: LessonInput) => void | Promise<void>
  onDelete?: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [groupsError, setGroupsError] = useState('')
  const { control, register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LessonInput>({
    defaultValues: {
      groupIds: lesson?.groups.map((group) => group.id) || (initialGroupId ? [initialGroupId] : []),
      type: lesson?.type || 'lecture',
      subjectId: lesson?.subject.id || '',
      teacherId: lesson?.teacher.id || initialTeacherId || '',
      dayOfWeek: lesson?.dayOfWeek || day,
      period: lesson?.period || period,
      weekStart: lesson?.weekStart || weekStart,
      roomId: lesson?.roomId?.id || '',
    },
  })
  const selectedSubjectId = useWatch({ control, name: 'subjectId' })
  const selectedTeacherId = useWatch({ control, name: 'teacherId' })
  const selectedType = (useWatch({ control, name: 'type' }) || 'lecture') as LessonType
  const selectedGroupIds = useWatch({ control, name: 'groupIds' }) || []
  const selectedRoomId = useWatch({ control, name: 'roomId' }) || ''
  const [selectedBuildingId, setSelectedBuildingId] = useState(lesson?.roomId?.building.id || '')
  const [buildings, setBuildings] = useState<Building[]>([])
  const [roomsLoadedQuery, setRoomsLoadedQuery] = useState('')
  const [roomLoadFailure, setRoomLoadFailure] = useState<{ query: string; error: string } | null>(null)
  const [roomRefreshVersion, setRoomRefreshVersion] = useState(0)
  const [subjectLoads, setSubjectLoads] = useState<SubjectLoadSummary[]>([])
  const [subjectLoadError, setSubjectLoadError] = useState('')
  // Nofaol guruh/o‘qituvchi faqat mavjud darsni tahrirlashda ko‘rinadi, yangi darsga tanlanmaydi.
  const selectableGroups = useMemo(
    () => groups.filter(
      (item) => (item.isActive !== false || lesson?.groups.some((group) => group.id === item.id)) && Boolean(subjects.find((subject) => subject.id === selectedSubjectId)?.groups?.some((group) => group.id === item.id)),
    ),
    [groups, lesson, subjects, selectedSubjectId],
  )
  const selectableTeachers = useMemo(
    () => teachers.filter((item) => item.isActive !== false || item.id === lesson?.teacher.id),
    [teachers, lesson],
  )
  // O‘qituvchi jadvaldagi katakdan olinadi — modalda faqat ko‘rsatiladi, o‘zgartirilmaydi.
  const fixedTeacher = useMemo<Pick<User, 'id' | 'name'> & { isActive?: boolean } | null>(() => {
    const teacherId = lesson?.teacher.id || initialTeacherId
    if (!teacherId) return null
    const fromList = teachers.find((item) => item.id === teacherId)
    if (fromList) return fromList
    return lesson?.teacher ? { id: lesson.teacher.id, name: lesson.teacher.name } : null
  }, [initialTeacherId, lesson, teachers])
  // Fanlar faqat o‘qituvchi profiliga administrator biriktirgan ro‘yxatdan olinadi.
  // Oldingi jadval darslari bu ro‘yxatni kengaytirmaydi.
  const selectedTeacherSubjects = useMemo(() => {
    if (!selectedTeacherId) return new Set<string>()
    const teacher = teachers.find((item) => item.id === selectedTeacherId)
    return new Set<string>(teacher?.subjectIds || [])
  }, [selectedTeacherId, teachers])
  const selectableSubjects = useMemo(
    () => subjects.filter((subject) => selectedTeacherSubjects.has(subject.id)),
    [selectedTeacherSubjects, subjects],
  )
  const previousTeacherId = useRef(selectedTeacherId)
  const previousSubjectId = useRef(selectedSubjectId)
  const matchingTeachers = useMemo(() => {
    return selectableTeachers.filter((teacher) => {
      if (!selectedSubjectId) return true
      return (teacher.subjectIds || []).includes(selectedSubjectId)
    })
  }, [selectedSubjectId, selectableTeachers])

  useEffect(() => {
    const teacherChanged = previousTeacherId.current !== selectedTeacherId
    const subjectChanged = previousSubjectId.current !== selectedSubjectId
    previousTeacherId.current = selectedTeacherId
    previousSubjectId.current = selectedSubjectId
    if (!teacherChanged && !subjectChanged) return

    // O‘qituvchi almashganda unga tegishli bo‘lmagan fan tozalanadi, tanlangan o‘qituvchi saqlanadi.
    if (teacherChanged && selectedSubjectId && !selectableSubjects.some((subject) => subject.id === selectedSubjectId)) {
      setValue('subjectId', '')
      return
    }
    if (subjectChanged) setValue('groupIds', [])
    // Fan almashganda faqat shu fanni o‘tadigan o‘qituvchilar qoladi.
    if (subjectChanged && selectedTeacherId && !matchingTeachers.some((teacher) => teacher.id === selectedTeacherId)) {
      setValue('teacherId', '')
    }
  }, [matchingTeachers, selectableSubjects, selectedTeacherId, selectedSubjectId, setValue])

  // Shu parada boshqa darsga biriktirilgan guruhlar — ularni qayta tanlab bo‘lmaydi.
  const slotBusyGroups = useMemo(
    () => busyGroupIdsAtSlot(lessons, { dayOfWeek: day, period, excludeLessonId: lesson?.id }),
    [day, lesson?.id, lessons, period],
  )
  const dayLabel = DAYS.find((item) => item.value === (lesson?.dayOfWeek || day))?.label
  const lessonPeriod = lesson?.period || period
  const lessonWeekStart = lesson?.weekStart || weekStart
  const roomQueryParams = new URLSearchParams({
    weekStart: lessonWeekStart,
    dayOfWeek: String(lesson?.dayOfWeek || day),
    period: String(lessonPeriod),
  })
  if (lesson?.id) roomQueryParams.set('excludeLessonId', lesson.id)
  const roomQuery = roomQueryParams.toString()
  const roomRequestKey = `${roomQuery}:${roomRefreshVersion}`
  const roomsLoading = roomsLoadedQuery !== roomRequestKey
  const roomsError = roomLoadFailure?.query === roomRequestKey ? roomLoadFailure.error : ''
  const isMissingReferences = groups.length === 0 || subjects.length === 0 || selectableTeachers.length === 0
    || (!roomsLoading && !roomsError && !buildings.some((building) => building.isActive && building.rooms.some((room) => room.isActive)))
  const pending = busy || isSubmitting
  const selectedBuilding = buildings.find((building) => building.id === selectedBuildingId)
  const availableRooms = (selectedBuilding?.rooms || []).filter((room) =>
    room.isActive && !room.occupied && roomSupportsLesson(room.kind, selectedType),
  )

  useEffect(() => {
    let active = true
    if (!selectedSubjectId || !selectedGroupIds.length) {
      setSubjectLoads([]); setSubjectLoadError('')
      return () => { active = false }
    }
    const params = new URLSearchParams({ groupIds: selectedGroupIds.join(',') })
    api<SubjectLoadSummary[]>(`/subjects/${selectedSubjectId}/load-summary?${params}`)
      .then((result) => { if (active) { setSubjectLoads(result); setSubjectLoadError('') } })
      .catch((requestError) => { if (active) { setSubjectLoads([]); setSubjectLoadError(requestError instanceof Error ? requestError.message : 'Fan yuklamasini yuklab bo‘lmadi.') } })
    return () => { active = false }
  }, [selectedGroupIds, selectedSubjectId])

  useEffect(() => subscribeToRealtime((event) => {
    if (
      event.type === 'reconnected' ||
      event.type === 'lessons:changed' ||
      event.type === 'rooms:changed'
    ) {
      setRoomRefreshVersion((version) => version + 1)
    }
  }), [])

  useEffect(() => {
    let active = true
    api<Building[]>(`/buildings?${roomQuery}`)
      .then((result) => {
        if (active) {
          setBuildings(result)
          setRoomsLoadedQuery(roomRequestKey)
        }
      })
      .catch((requestError) => {
        if (active) {
          setRoomLoadFailure({
            query: roomRequestKey,
            error: requestError instanceof Error ? requestError.message : 'Xonalarni yuklab bo‘lmadi.',
          })
          setRoomsLoadedQuery(roomRequestKey)
        }
      })
    return () => { active = false }
  }, [roomQuery, roomRequestKey])

  useEffect(() => {
    if (roomsLoading || roomsError) return
    if (selectedRoomId && !availableRooms.some((room) => room.id === selectedRoomId)) {
      setValue('roomId', '')
    }
  }, [availableRooms, roomsError, roomsLoading, selectedRoomId, setValue])

  function roomSupportsLesson(kind: RoomKind, type: LessonType) {
    return kind === 'multi' || (type === 'lab' ? kind === 'laboratory' : kind !== 'laboratory')
  }

  function changeType(nextType: LessonType) {
    setValue('type', nextType)
    setGroupsError('')
    // Amaliyot va laboratoriyada faqat bitta guruh qoladi.
    if (nextType !== 'lecture' && selectedGroupIds.length > 1) {
      setValue('groupIds', selectedGroupIds.slice(0, 1))
    }
  }

  function updateGroupSelection(nextGroupIds: string[]) {
    if (selectedType === 'lecture' && nextGroupIds.length > MAX_LECTURE_GROUPS) {
      setGroupsError(`Ma’ruzaga ko‘pi bilan ${MAX_LECTURE_GROUPS} ta guruh birlashtiriladi.`)
      return
    }
    setGroupsError('')
    setValue('groupIds', nextGroupIds, { shouldDirty: true })
  }

  function submitLesson(values: LessonInput) {
    const groupIds = values.groupIds || []
    const type = values.type || 'lecture'
    if (!groupIds.length) {
      setGroupsError('Kamida bitta guruhni tanlang.')
      return
    }
    if (type !== 'lecture' && groupIds.length !== 1) {
      setGroupsError('Bitta guruh tanlanadi. Guruhning kunlik darslari ketma-ket bo‘lishi kerak.')
      return
    }
    if (type === 'lecture' && groupIds.length > MAX_LECTURE_GROUPS) {
      setGroupsError(`Ma’ruzaga ko‘pi bilan ${MAX_LECTURE_GROUPS} ta guruh birlashtiriladi.`)
      return
    }
    if (groupIds.some((groupId) => slotBusyGroups.has(groupId))) {
      setGroupsError('Tanlangan guruhlardan biri bu parada boshqa darsga biriktirilgan. Bir guruhga bir parada faqat bitta dars qo‘yiladi.')
      return
    }
    if (!values.roomId) return
    setGroupsError('')
    void onSave({ ...values, type, groupIds })
  }

  function handleClose() {
    if (pending) return
    if (confirmDelete) {
      setConfirmDelete(false)
      return
    }
    onClose()
  }

  return (
    <>
      <Modal
        open
        onClose={handleClose}
        size="wide"
        placement="right"
        eyebrow={lesson ? 'Jadvalni tahrirlash' : 'Yangi dars'}
        title={lesson ? 'Dars ma’lumotlari' : 'Dars biriktirish'}
        description={`${dayLabel}, ${lessonPeriod}-para${weekLabel ? ` · ${weekLabel}` : ''}`}
        icon={<EventNoteRoundedIcon />}
      >
        {isMissingReferences ? (
          <div className="flex min-h-0 flex-1 flex-col justify-between p-6 sm:p-8">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
              <p className="flex items-center gap-2 font-bold text-base">
                <WarningAmberRoundedIcon sx={{ fontSize: 20 }} />
                Ma’lumotlar yetarli emas
              </p>
              <p className="mt-2">
                Dars biriktirishdan oldin kamida bitta guruh, fan, o‘qituvchi va faol bino-xona yarating.
              </p>
              <ul className="mt-3.5 grid gap-1.5 text-xs font-medium">
                {!groups.some((group) => group.isActive !== false) && (
                  <li>• {groups.length ? 'Guruhlar bo‘limida guruhni faollashtiring' : 'Guruhlar bo‘limida guruh qo‘shing'}</li>
                )}
                {subjects.length === 0 && <li>• Fanlar bo‘limida fan qo‘shing</li>}
                {selectableTeachers.length === 0 && (
                  <li>• {teachers.length ? 'Hisoblar bo‘limida o‘qituvchini faollashtiring' : 'Hisoblar bo‘limida o‘qituvchi yarating'}</li>
                )}
                {!roomsLoading && !buildings.some((building) => building.isActive && building.rooms.some((room) => room.isActive)) && (
                  <li>• Binolar va xonalar bo‘limida faol bino va xona qo‘shing</li>
                )}
              </ul>
            </div>
            <div className="mt-6 flex justify-end">
              <Button variant="secondary" onClick={handleClose}>Yopish</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(submitLesson)} className="flex min-h-0 flex-1 flex-col justify-between" noValidate>
            <div className="grid gap-5 px-4 py-5 sm:px-7 sm:py-7 lg:px-10">
              <input type="hidden" {...register('dayOfWeek', { valueAsNumber: true })} />
              <input type="hidden" {...register('period', { valueAsNumber: true })} />
              <input type="hidden" {...register('weekStart')} />
              <input type="hidden" {...register('type')} />

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  <CalendarMonthRoundedIcon sx={{ fontSize: 15 }} /> {dayLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  <ScheduleRoundedIcon sx={{ fontSize: 15 }} /> {lessonPeriod}-para
                </span>
                {weekLabel && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                    <DateRangeRoundedIcon sx={{ fontSize: 15 }} /> {weekLabel}
                  </span>
                )}
              </div>

              {isPastOrToday && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-xs leading-5 text-amber-900 shadow-sm">
                  <p className="flex items-center gap-1.5 font-bold text-amber-950">
                    <WarningAmberRoundedIcon sx={{ fontSize: 18 }} />
                    {lesson ? 'Darsni o‘zgartirib bo‘lmaydi' : 'Dars qo‘yish taqiqlangan'}
                  </p>
                  <p className="mt-1">
                    {lesson
                      ? 'Bu dars bugungi yoki o‘tib ketgan kunga tegishli. O‘qituvchi va talabalar jadvaldan kamida 1 kun oldin xabardor bo‘lishi shart, shu sababli dars ma’lumotlarini tahrirlash cheklangan (zarur bo‘lsa jadvaldan o‘chirishingiz mumkin).'
                      : 'Bugungi va o‘tib ketgan kunlarga yangi dars qo‘yib bo‘lmaydi. Darslar faqat kamida 1 kun oldin (ertangi va kelgusi kunlar uchun) rejalashtirilishi kerak.'}
                  </p>
                </div>
              )}

              <section className="rounded-2xl border border-slate-200 bg-surface p-4 sm:p-6">
                <div className="mb-4 flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand-100 text-sm font-bold text-brand-700">1</span><div><h3 className="text-base font-bold text-slate-900">Mashg‘ulot turini tanlang</h3><p className="mt-0.5 text-sm text-slate-500">Yuklama tanlangan dars turi bo‘yicha hisoblanadi.</p></div></div>
              <FormField icon={<CategoryRoundedIcon />}
                label="Dars turi"
                required
                hint="Ma’ruzaga 1–6 ta guruh, amaliyot va laboratoriyaga bitta guruh tanlanadi."
              >
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {LESSON_TYPES.map((option) => {
                    const active = selectedType === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        disabled={pending || isPastOrToday}
                        onClick={() => changeType(option.value)}
                        className={`grid min-h-20 gap-1 rounded-xl border px-2 py-3 text-center transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          active
                            ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-100'
                            : 'border-slate-200 bg-surface text-slate-600 hover:border-brand-200 hover:bg-brand-50/60'
                        }`}
                      >
                        <span className="text-sm font-bold">{option.label}</span>
                        <span className="text-xs font-medium text-slate-500">{option.hint}</span>
                      </button>
                    )
                  })}
                </div>
              </FormField>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-surface p-4 sm:p-6">
                <div className="mb-4 flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand-100 text-sm font-bold text-brand-700">2</span><div><h3 className="text-base font-bold text-slate-900">O‘qituvchi va fanni aniqlang</h3><p className="mt-0.5 text-sm text-slate-500">O‘qituvchi tanlangach, unga biriktirilgan fanlar chiqadi.</p></div></div>
              <div className="grid items-start gap-5 lg:grid-cols-2">
              <FormField icon={<PersonRoundedIcon />}
                label="O‘qituvchi"
                required
                error={errors.teacherId?.message}
                hint={
                  fixedTeacher
                    ? 'O‘qituvchi jadvaldagi katakdan olinadi — o‘zgartirib bo‘lmaydi.'
                    : selectedSubjectId
                      ? 'Ro‘yxat tanlangan fanga mos o‘qituvchilar bilan cheklangan.'
                      : undefined
                }
              >
                {fixedTeacher ? (
                  <>
                    <input type="hidden" {...register('teacherId', { required: 'O‘qituvchini tanlang.' })} />
                    <div
                      className="mt-2 flex h-12 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 shadow-sm"
                      title="O‘qituvchi jadvaldagi katak bo‘yicha tanlangan"
                    >
                      <span className="truncate font-medium text-slate-800">{fixedTeacher.name}</span>
                      {fixedTeacher.isActive === false && <Badge tone="neutral">Nofaol</Badge>}
                    </div>
                  </>
                ) : (
                  <select
                    className={selectClass}
                    aria-invalid={Boolean(errors.teacherId)}
                    disabled={pending || isPastOrToday}
                    {...register('teacherId', { required: 'Tanlangan fanga mos o‘qituvchini tanlang.' })}
                  >
                    <option value="">O‘qituvchini tanlang</option>
                    {matchingTeachers.map((item) => {
                      const isUnassigned = !item.subjectIds?.length
                        && !lessons.some((scheduledLesson) => scheduledLesson.teacher.id === item.id)
                      return (
                        <option value={item.id} key={item.id}>
                          {item.name}{isUnassigned ? ' · fan biriktirilmagan' : ''}
                        </option>
                      )
                    })}
                  </select>
                )}
              </FormField>

              {!fixedTeacher && selectedSubjectId && matchingTeachers.length === 0 && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  Bu fan uchun mos yoki hali fan biriktirilmagan o‘qituvchi topilmadi.
                </p>
              )}

                <FormField icon={<MenuBookRoundedIcon />}
                  label="Fan"
                  required
                  error={errors.subjectId?.message}
                  hint={
                    selectedTeacherId
                      ? selectableSubjects.length
                        ? 'Faqat shu o‘qituvchiga biriktirilgan fanlar ko‘rsatilgan.'
                        : 'Bu o‘qituvchiga fan biriktirilmagan. Hisoblar bo‘limidan fan qo‘shing.'
                      : 'Avval o‘qituvchini tanlang.'
                  }
                >
                  <select
                    className={selectClass}
                    aria-invalid={Boolean(errors.subjectId)}
                    disabled={pending || isPastOrToday || !selectedTeacherId}
                    {...register('subjectId', { required: 'Fanni tanlang.' })}
                  >
                    <option value="">Fanni tanlang</option>
                    {selectableSubjects.map((item) => (
                      <option value={item.id} key={item.id}>{item.name}</option>
                    ))}
                  </select>
                </FormField>
              </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-surface p-4 sm:p-6">
                <div className="mb-4 flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand-100 text-sm font-bold text-brand-700">3</span><div><h3 className="text-base font-bold text-slate-900">Guruhlarni va yuklamani tekshiring</h3><p className="mt-0.5 text-sm text-slate-500">Faqat tanlangan fanga biriktirilgan guruhlar ko‘rsatiladi.</p></div></div>
              <FormField
                label={selectedType === 'lecture' ? 'Guruhlar' : 'Guruh'}
                required
                error={groupsError || undefined}
                hint={
                  selectedType === 'lecture'
                    ? `Bir nechta guruhni belgilang — ko‘pi bilan ${MAX_LECTURE_GROUPS} ta. Har bir guruhning kunlik darslari ketma-ket bo‘lishi kerak.`
                    : 'Bitta guruh tanlanadi. Guruhning kunlik darslari ketma-ket bo‘lishi kerak.'
                }
              >
                {selectedType === 'lecture' ? (
                  <MultiSelect
                    options={selectableGroups.map((item) => {
                      const alreadySelected = selectedGroupIds.includes(item.id)
                      const busyHint = slotBusyGroups.get(item.id)
                      return {
                        id: item.id,
                        label: `${item.name} · ${item.year}-kurs`,
                        hint: item.isActive === false
                          ? 'Nofaol guruh'
                          : !alreadySelected && busyHint
                            ? busyHint
                            : undefined,
                        disabled: !alreadySelected && Boolean(busyHint),
                      }
                    })}
                    value={selectedGroupIds}
                    onChange={updateGroupSelection}
                    placeholder="Guruhlarni tanlang"
                    emptyText="Bu fanga faol guruh biriktirilmagan."
                    disabled={pending || isPastOrToday || !selectedSubjectId}
                    ariaLabel="Guruhlar"
                  />
                ) : (
                  <select
                    className={selectClass}
                    disabled={pending || isPastOrToday || !selectedSubjectId}
                    value={selectedGroupIds[0] || ''}
                    onChange={(event) => updateGroupSelection(event.target.value ? [event.target.value] : [])}
                  >
                    <option value="">Guruhni tanlang</option>
                    {selectableGroups.map((item) => {
                      const alreadySelected = selectedGroupIds[0] === item.id
                      const busyHint = slotBusyGroups.get(item.id)
                      return (
                        <option value={item.id} key={item.id} disabled={!alreadySelected && Boolean(busyHint)}>
                          {item.name} · {item.year}-kurs{item.isActive === false ? ' · nofaol' : ''}
                          {!alreadySelected && busyHint ? ' · bu parada band' : ''}
                        </option>
                      )
                    })}
                  </select>
                )}
                {selectedType === 'lecture' && selectedGroupIds.length > 1 && (
                  <span className="mt-1.5 block text-[11px] font-medium text-brand-700">
                    {selectedGroupIds.length} ta guruh bitta ma’ruzaga birlashtirildi.
                  </span>
                )}
              </FormField>
              {selectedGroupIds.length > 0 && selectedSubjectId && (
                <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3.5">
                  <p className="text-sm font-bold text-sky-900">Fan yuklamasi</p><p className="mt-1 text-xs text-sky-700">Har bir guruh alohida hisoblanadi. Bir para — 2 akademik soat.</p>
                  {subjectLoadError ? <p className="mt-1 text-xs text-rose-700">{subjectLoadError}</p> : (
                    <div className="mt-2 grid gap-1.5">
                      {subjectLoads.map((item) => {
                        const group = groups.find((entry) => entry.id === item.groupId)
                        const load = item.types.find((entry) => entry.type === selectedType)
                        return <p key={item.groupId} className={`text-xs ${load && load.remaining < 2 ? 'font-bold text-rose-700' : 'text-sky-800'}`}>
                          {group?.name || 'Guruh'} — rejalashtirilgan: {load?.planned ?? 0} / {load?.allocated ?? 0} soat · qoldi: {load?.remaining ?? 0} soat
                        </p>
                      })}
                    </div>
                  )}
                </div>
              )}

              </section>
              <section className="rounded-2xl border border-slate-200 bg-surface p-4 sm:p-6">
                <div className="mb-4 flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand-100 text-sm font-bold text-brand-700">4</span><div><h3 className="text-base font-bold text-slate-900">Dars joyini tanlang</h3><p className="mt-0.5 text-sm text-slate-500">Bino tanlangach, shu vaqtga mos bo‘sh xonalar chiqadi.</p></div></div>
              <div className="grid items-start gap-5 lg:grid-cols-2">
              <FormField icon={<ApartmentRoundedIcon />}
                label="Bino"
                required
                hint="Avval binoni tanlang — shu vaqtdagi bo‘sh xonalar ko‘rsatiladi."
              >
                <select
                  className={selectClass}
                  disabled={pending || isPastOrToday || roomsLoading || Boolean(roomsError)}
                  value={selectedBuildingId}
                  onChange={(event) => {
                    setSelectedBuildingId(event.target.value)
                    setValue('roomId', '', { shouldDirty: true })
                  }}
                >
                  <option value="">Binoni tanlang</option>
                  {buildings.filter((building) => building.isActive).map((building) => (
                    <option value={building.id} key={building.id}>{building.name}</option>
                  ))}
                </select>
                {roomsError && <span className="mt-1.5 block text-xs text-rose-600">{roomsError}</span>}
              </FormField>

              <FormField icon={<MeetingRoomRoundedIcon />}
                label="Xona"
                required
                error={errors.roomId?.message}
                hint={
                  roomsLoading
                    ? 'Xonalar yangilanmoqda…'
                    : selectedBuildingId && !availableRooms.length
                      ? 'Bu binoda tanlangan vaqt va dars turiga mos bo‘sh xona yo‘q.'
                      : selectedBuilding
                        ? `${availableRooms.length} ta mos bo‘sh xona`
                        : 'Xonalarni ko‘rish uchun binoni tanlang.'
                }
              >
                <select
                  className={selectClass}
                  disabled={pending || isPastOrToday || !selectedBuildingId || roomsLoading || Boolean(roomsError)}
                  aria-invalid={Boolean(selectedBuildingId && !availableRooms.length && !roomsLoading)}
                  {...register('roomId', { required: 'Bo‘sh xonani tanlang.' })}
                >
                  <option value="">{roomsLoading ? 'Xonalar yuklanmoqda…' : 'Bo‘sh xonani tanlang'}</option>
                  {availableRooms.map((room) => (
                    <option value={room.id} key={room.id}>
                      {room.number}-xona · {room.capacity} o‘rin
                      {room.floor ? ` · ${room.floor}-qavat` : ''}
                    </option>
                  ))}
                </select>
                {!roomsLoading && !roomsError && selectedBuilding && (
                  <div
                    className={`mt-2 rounded-xl border px-3 py-2.5 text-xs ${
                      selectedBuilding?.rooms.some((room) => room.occupied)
                        ? 'border-amber-200 bg-amber-50 text-amber-900'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    }`}
                    aria-live="polite"
                  >
                    <p className="font-bold">
                      {selectedBuilding?.rooms.some((room) => room.occupied)
                        ? 'Shu vaqtda band xonalar'
                        : 'Shu vaqtda band xona yo‘q'}
                    </p>
                    {selectedBuilding?.rooms.some((room) => room.occupied) && (
                      <ul className="mt-1.5 grid gap-1">
                        {selectedBuilding.rooms.filter((room) => room.occupied).map((room) => (
                          <li key={room.id}>
                            <span className="font-semibold">{room.number}-xona</span>
                            {' — '}
                            {room.lesson?.subject}, {room.lesson?.teacher}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-1.5 opacity-80">Band xona tanlash mumkin emas — uni boshqa darsga ajratilgan.</p>
                  </div>
                )}
              </FormField>
              </div>
              </section>
            </div>

            <div className="sticky bottom-0 mt-auto flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 bg-surface/95 px-6 py-4 backdrop-blur sm:px-8">
              {onDelete ? (
                <Button
                  variant="dangerSoft"
                  startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />}
                  onClick={() => setConfirmDelete(true)}
                  disabled={pending}
                >
                  O‘chirish
                </Button>
              ) : <span />}
              <div className="flex flex-1 justify-end gap-2.5 sm:flex-none">
                <Button variant="secondary" onClick={handleClose} disabled={pending}>
                  {isPastOrToday ? 'Yopish' : 'Bekor qilish'}
                </Button>
                {!isPastOrToday && (
                  <Button
                    type="submit"
                    loading={pending}
                    loadingText="Saqlanmoqda..."
                    disabled={roomsLoading || Boolean(roomsError) || !selectedRoomId}
                  >
                    {lesson ? 'Saqlash' : 'Biriktirish'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        )}
      </Modal>

      {onDelete && (
        <ConfirmDialog
          open={confirmDelete}
          title="Darsni jadvaldan o‘chirasizmi?"
          description={`${weekLabel ? `${weekLabel} · ` : ''}${dayLabel}, ${lessonPeriod}-para${lesson ? ` · ${lessonGroupNames(lesson)} · ${lesson.subject.name}` : ''}. Bu amalni qaytarib bo‘lmaydi.`}
          confirmLabel="O‘chirish"
          loading={pending}
          onConfirm={onDelete}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </>
  )
}
