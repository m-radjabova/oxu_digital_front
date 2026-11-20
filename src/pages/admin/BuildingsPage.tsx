import FilterSelect from '../../components/ui/FilterSelect'
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import LayersRoundedIcon from '@mui/icons-material/LayersRounded'
import { useCallback, useMemo, useState, type FormEvent } from 'react'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded'
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded'
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import InfoRoundedIcon from '@mui/icons-material/InfoRounded'
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded'
import { api } from '../../lib/api'
import useApiResource from '../../hooks/useApiResource'
import useToast from '../../hooks/useToast'
import type { Building, Room, RoomKind } from '../../types'
import { addDays, formatWeekRange, startOfWeek, toDateKey } from '../../utils/date'
import { PERIODS } from '../../utils/periods'
import PageHeading from '../../components/PageHeading'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card, { SectionHeader } from '../../components/ui/Card'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import { FormField } from '../../components/ui/Field'
import { inputClass, selectClass } from '../../components/ui/fieldStyles'
import Modal from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import { CampusMap, FacadeIllustration } from './CampusIllustrations'
import { MAP_SLOT_COUNT } from './campusSlots'

const DAYS = [
  { value: 1, label: 'Dushanba' }, { value: 2, label: 'Seshanba' },
  { value: 3, label: 'Chorshanba' }, { value: 4, label: 'Payshanba' },
  { value: 5, label: 'Juma' }, { value: 6, label: 'Shanba' },
]

const ROOM_KIND_LABELS: Record<RoomKind, string> = {
  lecture: 'Ma’ruza zali',
  classroom: 'Auditoriya',
  laboratory: 'Laboratoriya',
  multi: 'Universal xona',
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400'

interface BuildingValues {
  name: string
  address: string
}

interface RoomValues {
  number: string
  floor: string
  capacity: string
  kind: RoomKind
}

type DeleteTarget =
  | { type: 'building'; id: string; name: string }
  | { type: 'room'; id: string; name: string }

/* ======================================================================
   Sahifa
   ====================================================================== */

export default function BuildingsPage() {
  const toast = useToast()
  const [weekStart, setWeekStart] = useState(() => toDateKey(startOfWeek(new Date())))
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [period, setPeriod] = useState(1)
  const [selectedBuildingId, setSelectedBuildingId] = useState('')
  const [activeFloorKey, setActiveFloorKey] = useState('')
  const [isFloorOpen, setIsFloorOpen] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [buildingValues, setBuildingValues] = useState<BuildingValues>({ name: '', address: '' })
  const [roomValues, setRoomValues] = useState<RoomValues>({
    number: '',
    floor: '',
    capacity: '36',
    kind: 'classroom',
  })
  const [editingBuildingId, setEditingBuildingId] = useState('')
  const [editingRoomId, setEditingRoomId] = useState('')
  const [formDialog, setFormDialog] = useState<'building' | 'room' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [savingBuilding, setSavingBuilding] = useState(false)
  const [savingRoom, setSavingRoom] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const requestQuery = new URLSearchParams({
    weekStart,
    dayOfWeek: String(dayOfWeek),
    period: String(period),
  }).toString()
  const { data: buildings, isLoading, error: loadError, refresh } = useApiResource<Building>(`/buildings?${requestQuery}`)
  const selectedBuilding = buildings.find((building) => building.id === selectedBuildingId)
    || buildings.find((building) => building.isActive)
    || buildings[0]
  const rooms = useMemo(() => selectedBuilding?.rooms || [], [selectedBuilding])
  const occupiedCount = rooms.filter((room) => room.isActive && room.occupied).length
  const freeCount = rooms.filter((room) => room.isActive && !room.occupied).length

  const floorGroups = useMemo(() => {
    const map = new Map<number | null, Room[]>()
    for (const room of rooms) {
      const key = room.floor ? Number(room.floor) : null
      map.set(key, [...(map.get(key) || []), room])
    }
    return [...map.entries()]
      .sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : a - b))
      .map(([floor, list]) => ({
        key: floor === null ? 'none' : String(floor),
        label: floor === null ? 'Qavatsiz' : `${floor}-qavat`,
        title: floor === null ? 'Qavat belgilanmagan xonalarda' : `${floor}-qavatda`,
        rooms: list,
      }))
  }, [rooms])
  const activeFloor = floorGroups.find((group) => group.key === activeFloorKey) || floorGroups[0]
  const floorCount = floorGroups.filter((group) => group.key !== 'none').length

  const floorFree = activeFloor?.rooms.filter((room) => room.isActive && !room.occupied).length ?? 0
  const floorBusy = activeFloor?.rooms.filter((room) => room.isActive && room.occupied).length ?? 0
  const floorOff = activeFloor?.rooms.filter((room) => !room.isActive).length ?? 0

  function selectBuilding(id: string) {
    setSelectedBuildingId(id)
    setActiveFloorKey('')
    setIsFloorOpen(true)
    cancelRoomEdit()
  }

  function toggleFloor(key: string) {
    if (activeFloor?.key === key) {
      setIsFloorOpen((open) => !open)
      return
    }
    setActiveFloorKey(key)
    setIsFloorOpen(true)
  }

  function moveWeek(amount: number) {
    setWeekStart(toDateKey(addDays(weekStart, amount * 7)))
  }

  function openBuildingForm(building?: Building) {
    cancelRoomEdit()
    setEditingBuildingId(building?.id || '')
    setBuildingValues({ name: building?.name || '', address: building?.address || '' })
    setFormDialog('building')
  }

  function startBuildingEdit(building: Building) {
    openBuildingForm(building)
  }

  function cancelBuildingEdit() {
    setEditingBuildingId('')
    setBuildingValues({ name: '', address: '' })
    setFormDialog((current) => current === 'building' ? null : current)
  }

  function openRoomForm(room?: Room) {
    if (!selectedBuilding) return
    cancelBuildingEdit()
    setEditingRoomId(room?.id || '')
    setRoomValues(room
      ? {
          number: room.number,
          floor: room.floor ? String(room.floor) : '',
          capacity: String(room.capacity),
          kind: room.kind,
        }
      : { number: '', floor: '', capacity: '36', kind: 'classroom' })
    setFormDialog('room')
  }

  function startRoomEdit(room: Room) {
    openRoomForm(room)
  }

  function cancelRoomEdit() {
    setEditingRoomId('')
    setRoomValues({ number: '', floor: '', capacity: '36', kind: 'classroom' })
    setFormDialog((current) => current === 'room' ? null : current)
  }

  const closeFormDialog = useCallback(() => {
    if (formDialog === 'building') {
      if (!savingBuilding) cancelBuildingEdit()
    } else if (formDialog === 'room' && !savingRoom) {
      cancelRoomEdit()
    }
  }, [formDialog, savingBuilding, savingRoom])

  async function submitBuilding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavingBuilding(true)
    try {
      await api(editingBuildingId ? `/buildings/${editingBuildingId}` : '/buildings', {
        method: editingBuildingId ? 'PUT' : 'POST',
        body: JSON.stringify(buildingValues),
      })
      const message = editingBuildingId ? 'Bino ma’lumotlari yangilandi.' : 'Yangi bino qo‘shildi.'
      cancelBuildingEdit()
      await refresh()
      toast.success(message, 'Saqlandi')
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Binoni saqlab bo‘lmadi.')
    } finally {
      setSavingBuilding(false)
    }
  }

  async function submitRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedBuilding) return
    setSavingRoom(true)
    try {
      await api(editingRoomId ? `/rooms/${editingRoomId}` : `/buildings/${selectedBuilding.id}/rooms`, {
        method: editingRoomId ? 'PUT' : 'POST',
        body: JSON.stringify({
          buildingId: selectedBuilding.id,
          number: roomValues.number,
          floor: roomValues.floor || null,
          capacity: Number(roomValues.capacity),
          kind: roomValues.kind,
        }),
      })
      const message = editingRoomId ? 'Xona ma’lumotlari yangilandi.' : 'Yangi xona qo‘shildi.'
      cancelRoomEdit()
      await refresh()
      toast.success(message, 'Saqlandi')
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Xonani saqlab bo‘lmadi.')
    } finally {
      setSavingRoom(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api(deleteTarget.type === 'building' ? `/buildings/${deleteTarget.id}` : `/rooms/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      toast.success(deleteTarget.type === 'building' ? 'Bino o‘chirildi.' : 'Xona o‘chirildi.')
      if (deleteTarget.type === 'building' && deleteTarget.id === selectedBuildingId) {
        setSelectedBuildingId('')
      }
      if (deleteTarget.type === 'room' && deleteTarget.id === editingRoomId) cancelRoomEdit()
      setDeleteTarget(null)
      await refresh()
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'O‘chirib bo‘lmadi.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-3 pb-5 sm:px-4 lg:px-5 lg:pb-6">
      <PageHeading
        eyebrow="Universitet infratuzilmasi"
        title="Binolar va xonalar"
        description="Kampus xaritasidan binoni tanlang va tanlangan vaqtda qaysi xonalar bo‘shligini ko‘ring."
        icon={<ApartmentRoundedIcon />}
        action={<Badge tone="brand" dot className="h-8 px-3 text-xs">{buildings.length} ta bino</Badge>}
      />

      {loadError && (
        <div
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          role="alert"
        >
          <span className="flex items-center gap-2"><ErrorOutlineRoundedIcon sx={{ fontSize: 18 }} />{loadError}</span>
          <Button variant="dangerSoft" size="sm" startIcon={<RefreshRoundedIcon sx={{ fontSize: 15 }} />} onClick={() => void refresh()}>
            Qayta urinish
          </Button>
        </div>
      )}

      {/* Vaqt tanlash paneli */}
      <Card className="mb-5 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3 lg:w-64 lg:shrink-0">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
              <CalendarMonthRoundedIcon sx={{ fontSize: 20 }} />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-900">Bandlik vaqti</p>
              <p className="mt-0.5 text-xs text-slate-500">Xonalar shu vaqt uchun ko‘rsatiladi</p>
            </div>
          </div>
          <div className="grid flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,0.8fr)_minmax(0,1fr)]">
            <input
              type="date"
              className={inputClass}
              aria-label="Bandlik haftasi"
              value={weekStart}
              onChange={(event) => setWeekStart(toDateKey(startOfWeek(event.target.value)))}
            />
            <div className="flex items-center justify-between gap-1 rounded-xl border border-slate-200 bg-surface p-1">
              <button type="button" className={`grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 ${focusRing}`} aria-label="Oldingi hafta" onClick={() => moveWeek(-1)}>
                <ArrowBackIosNewRoundedIcon sx={{ fontSize: 13 }} />
              </button>
              <span className="px-1 text-xs font-semibold text-slate-600">{formatWeekRange(weekStart, toDateKey(addDays(weekStart, 5)))}</span>
              <button type="button" className={`grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 ${focusRing}`} aria-label="Keyingi hafta" onClick={() => moveWeek(1)}>
                <ArrowForwardIosRoundedIcon sx={{ fontSize: 13 }} />
              </button>
            </div>
            <FilterSelect icon={<CalendarTodayRoundedIcon />} className={selectClass} aria-label="Hafta kuni" value={dayOfWeek} onChange={(event) => setDayOfWeek(Number(event.target.value))}>
              {DAYS.map((day) => <option value={day.value} key={day.value}>{day.label}</option>)}
            </FilterSelect>
            <FilterSelect icon={<AccessTimeRoundedIcon />} className={selectClass} aria-label="Para" value={period} onChange={(event) => setPeriod(Number(event.target.value))}>
              {PERIODS.map((item) => <option value={item.number} key={item.number}>{item.number}-para · {item.start}</option>)}
            </FilterSelect>
          </div>
        </div>
      </Card>

      {/* Asosiy qism: xarita va bino tafsilotlari */}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(420px,1fr)_minmax(480px,1fr)]">
        {/* Kampus xaritasi */}
        <Card className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-md shadow-brand-600/25">
                <PlaceRoundedIcon sx={{ fontSize: 24 }} />
              </span>
              <div className="leading-tight">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Universitet Campus</h2>
                <p className="mt-0.5 text-sm text-slate-500">Barcha binolar xaritasi</p>
              </div>
            </div>
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200/70" aria-label="Belgilar izohi">
              <li className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-emerald-500" />Bo‘sh</li>
              <li className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-orange-400" />Band</li>
              <li className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-slate-300" />Mavjud emas</li>
            </ul>
          </div>

          <div className="relative mt-4">
            {isLoading && !buildings.length ? (
              <Skeleton className="aspect-[600/520] w-full rounded-2xl" />
            ) : (
              <>
                <CampusMap
                  buildings={buildings}
                  selectedId={selectedBuilding?.id || ''}
                  zoom={zoom}
                  onSelect={selectBuilding}
                />
                {!buildings.length && (
                  <div className="absolute inset-0 grid place-items-center p-6">
                    <p className="rounded-2xl bg-surface/95 px-5 py-4 text-center text-sm font-semibold text-slate-700 shadow-lg ring-1 ring-slate-200">
                      Kampusda hozircha bino yo‘q.
                      <span className="mt-1 block text-xs font-medium text-slate-500">                      “Boshqaruv” bo‘limidan yangi bino qo‘shing.</span>
                    </p>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 grid overflow-hidden rounded-xl bg-surface shadow-lg ring-1 ring-slate-200">
                  <button
                    type="button"
                    className={`grid size-10 place-items-center text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 ${focusRing}`}
                    aria-label="Yaqinlashtirish"
                    disabled={zoom >= 1.5}
                    onClick={() => setZoom((current) => Math.min(1.5, +(current + 0.25).toFixed(2)))}
                  >
                    <AddRoundedIcon sx={{ fontSize: 20 }} />
                  </button>
                  <span className="h-px bg-slate-200" aria-hidden="true" />
                  <button
                    type="button"
                    className={`grid size-10 place-items-center text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 ${focusRing}`}
                    aria-label="Uzoqlashtirish"
                    disabled={zoom <= 1}
                    onClick={() => setZoom((current) => Math.max(1, +(current - 0.25).toFixed(2)))}
                  >
                    <RemoveRoundedIcon sx={{ fontSize: 20 }} />
                  </button>
                </div>
              </>
            )}
          </div>

          {buildings.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-slate-500">
                Binolar ro‘yxati
                {buildings.length > MAP_SLOT_COUNT && ` (xaritada dastlabki ${MAP_SLOT_COUNT} ta ko‘rsatilgan)`}
              </p>
              <ul className="flex flex-wrap gap-2">
                {buildings.map((building) => {
                  const active = selectedBuilding?.id === building.id
                  const free = building.rooms.filter((room) => room.isActive && !room.occupied).length
                  return (
                    <li key={building.id}>
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => selectBuilding(building.id)}
                        className={`inline-flex items-center gap-2 rounded-full py-1.5 pl-3 pr-1.5 text-sm font-semibold transition ${focusRing} ${
                          active
                            ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                            : 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-surface hover:ring-slate-300'
                        }`}
                      >
                        {building.name}
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${active ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                          {free} bo‘sh
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </Card>

        {/* Bino tafsilotlari */}
        <Card className="overflow-hidden p-4 sm:p-5">
          {isLoading && !buildings.length ? (
            <div className="grid gap-4" role="status" aria-label="Bino ma’lumotlari yuklanmoqda">
              <div className="flex gap-4">
                <Skeleton className="h-32 w-44 shrink-0 rounded-2xl" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48 max-w-full" />
                  <Skeleton className="h-8 w-28 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-12 w-full rounded-2xl" />
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 6 }, (_, index) => <Skeleton className="h-28 rounded-2xl" key={index} />)}
              </div>
            </div>
          ) : !selectedBuilding ? (
            <EmptyState icon={<ApartmentRoundedIcon />} title="Bino tanlanmagan" description="Xonalar ro‘yxatini ko‘rish uchun bino qo‘shing yoki xaritadan tanlang." />
          ) : (
            <>
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="aspect-[240/168] w-full shrink-0 overflow-hidden rounded-2xl ring-1 ring-slate-200/70 sm:w-52">
                  <FacadeIllustration />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate text-2xl font-extrabold tracking-tight text-slate-900">{selectedBuilding.name}</h2>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                        <PlaceRoundedIcon sx={{ fontSize: 16 }} className="shrink-0 text-brand-500" />
                        <span className="truncate">{selectedBuilding.address || 'Manzil kiritilmagan'}</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        className={`grid size-9 place-items-center rounded-xl text-slate-500 transition hover:bg-brand-50 hover:text-brand-700 ${focusRing}`}
                        aria-label={`${selectedBuilding.name} binosini tahrirlash`}
                        onClick={() => startBuildingEdit(selectedBuilding)}
                      >
                        <EditRoundedIcon sx={{ fontSize: 18 }} />
                      </button>
                      <button
                        type="button"
                        className={`grid size-9 place-items-center rounded-xl text-rose-500 transition hover:bg-rose-50 ${focusRing}`}
                        aria-label={`${selectedBuilding.name} binosini o‘chirish`}
                        onClick={() => setDeleteTarget({ type: 'building', id: selectedBuilding.id, name: selectedBuilding.name })}
                      >
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {floorCount > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-bold text-brand-700 ring-1 ring-inset ring-brand-100">
                        <ApartmentRoundedIcon sx={{ fontSize: 16 }} />
                        {floorCount} qavat
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
                      <MeetingRoomRoundedIcon sx={{ fontSize: 16 }} />
                      {rooms.length} xona
                    </span>
                    {!selectedBuilding.isActive && <Badge tone="neutral">Nofaol</Badge>}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone="success">{freeCount} bo‘sh</Badge>
                    <Badge tone={occupiedCount ? 'warning' : 'neutral'}>{occupiedCount} band</Badge>
                  </div>
                </div>
              </div>

              {rooms.length ? (
                <>
                  {/* Qavatlar */}
                  <div
                    className="mt-5 flex gap-2 overflow-x-auto rounded-2xl bg-slate-50 p-2 ring-1 ring-inset ring-slate-200/60 [scrollbar-width:thin]"
                    role="group"
                    aria-label="Qavatlar"
                  >
                    {floorGroups.map((group) => {
                      const active = activeFloor?.key === group.key
                      return (
                        <button
                          key={group.key}
                          type="button"
                          aria-expanded={active && isFloorOpen}
                          aria-controls={active ? `floor-rooms-${selectedBuilding.id}-${group.key}` : undefined}
                          onClick={() => toggleFloor(group.key)}
                          className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${focusRing} ${
                            active
                              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                              : 'text-slate-600 hover:bg-surface hover:text-slate-900'
                          }`}
                        >
                          {group.label}
                          <KeyboardArrowDownRoundedIcon
                            sx={{ fontSize: 18 }}
                            className={`ml-1 inline-block transition-transform duration-200 ${active && isFloorOpen ? 'rotate-180' : ''}`}
                          />
                        </button>
                      )
                    })}
                  </div>

                  {/* Xonalar */}
                  {activeFloor && (
                    <div
                      id={`floor-rooms-${selectedBuilding.id}-${activeFloor.key}`}
                      className={isFloorOpen ? 'animate-fade-in' : ''}
                      role="region"
                      aria-label={activeFloor.title}
                      hidden={!isFloorOpen}
                    >
                      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {activeFloor.rooms.map((room) => (
                          <li key={room.id}>
                            <RoomTile
                              room={room}
                              onEdit={() => startRoomEdit(room)}
                              onDelete={() => setDeleteTarget({ type: 'room', id: room.id, name: `${selectedBuilding.name} ${room.number}-xona` })}
                            />
                          </li>
                        ))}
                      </ul>

                      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-brand-50/70 p-4 ring-1 ring-inset ring-brand-100">
                        <InfoRoundedIcon sx={{ fontSize: 22 }} className="mt-0.5 shrink-0 text-brand-600" />
                        <div className="text-sm leading-6">
                          <p className="font-bold text-slate-900">{activeFloor.title} jami: {activeFloor.rooms.length} ta xona</p>
                          <p className="text-slate-600">
                            Shundan {floorFree} tasi bo‘sh, {floorBusy} tasi band, {floorOff} tasi mavjud emas
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-5">
                  <EmptyState icon={<MeetingRoomRoundedIcon />} title="Bu binoda xona yo‘q" description="Boshqaruv bo‘limidan xona raqami, turi va sig‘imini qo‘shing." />
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Boshqaruv */}
      <div className="mt-8">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Boshqaruv</h2>
          <span className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" aria-hidden="true" />
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <Card className="p-3 sm:p-4">
            <SectionHeader
              icon={<ApartmentRoundedIcon sx={{ fontSize: 18 }} />}
              title="Bino qo‘shish"
              description="Yangi bino nomi va manzilini kiriting."
            />
            <Button className="mt-5" fullWidth startIcon={<AddRoundedIcon sx={{ fontSize: 17 }} />} onClick={() => openBuildingForm()}>
              Bino qo‘shish
            </Button>
          </Card>

          <Card className="p-3 sm:p-4">
            <SectionHeader
              icon={<MeetingRoomRoundedIcon sx={{ fontSize: 18 }} />}
              title="Xona qo‘shish"
              description={selectedBuilding
                ? `${selectedBuilding.name} binosiga yangi xona kiriting.`
                : 'Xona qo‘shish uchun avval bino yarating yoki xaritadan tanlang.'}
            />
            <Button
              className="mt-5"
              fullWidth
              disabled={!selectedBuilding}
              startIcon={<AddRoundedIcon sx={{ fontSize: 17 }} />}
              onClick={() => openRoomForm()}
            >
              Xona qo‘shish
            </Button>
          </Card>
        </div>
      </div>

      <Modal
        open={formDialog !== null}
        onClose={closeFormDialog}
        placement="right"
        size="lg"
        title={formDialog === 'building'
          ? (editingBuildingId ? 'Binoni tahrirlash' : 'Yangi bino qo‘shish')
          : (editingRoomId ? 'Xonani tahrirlash' : 'Yangi xona qo‘shish')}
        description={formDialog === 'building'
          ? 'Bino nomi takrorlanmas bo‘lishi kerak.'
          : 'Xona raqami tanlangan bino ichida takrorlanmas bo‘lishi kerak.'}
        icon={formDialog === 'building'
          ? <ApartmentRoundedIcon sx={{ fontSize: 20 }} />
          : <MeetingRoomRoundedIcon sx={{ fontSize: 20 }} />}
      >
        {formDialog === 'building' && (
          <form className="flex min-h-0 flex-1 flex-col justify-between" onSubmit={(event) => void submitBuilding(event)}>
            <div className="grid gap-5 px-6 py-6 sm:px-8 sm:py-7">
              <FormField label="Bino nomi" required>
                <input
                  className={inputClass}
                  required
                  maxLength={100}
                  value={buildingValues.name}
                  onChange={(event) => setBuildingValues((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Masalan, 4-bino"
                />
              </FormField>
              <FormField label="Manzil" hint="Ixtiyoriy">
                <input
                  className={inputClass}
                  maxLength={200}
                  value={buildingValues.address}
                  onChange={(event) => setBuildingValues((current) => ({ ...current, address: event.target.value }))}
                  placeholder="Masalan, OXU kampusi"
                />
              </FormField>
            </div>
            <div className="sticky bottom-0 mt-auto flex justify-end gap-2.5 border-t border-slate-100 bg-surface/95 px-6 py-4 backdrop-blur sm:px-8">
              <Button variant="secondary" disabled={savingBuilding} onClick={cancelBuildingEdit}>Bekor qilish</Button>
              <Button type="submit" loading={savingBuilding} loadingText="Saqlanmoqda..." startIcon={<AddRoundedIcon sx={{ fontSize: 17 }} />}>
                {editingBuildingId ? 'O‘zgarishlarni saqlash' : 'Bino qo‘shish'}
              </Button>
            </div>
          </form>
        )}

        {formDialog === 'room' && selectedBuilding && (
          <form className="flex min-h-0 flex-1 flex-col justify-between" onSubmit={(event) => void submitRoom(event)}>
            <div className="grid gap-5 px-6 py-6 sm:px-8 sm:py-7">
              <FormField label="Xona raqami yoki nomi" required>
                <input
                  className={inputClass}
                  required
                  maxLength={40}
                  value={roomValues.number}
                  onChange={(event) => setRoomValues((current) => ({ ...current, number: event.target.value }))}
                  placeholder="Masalan, 705 yoki M-1"
                />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField icon={<LayersRoundedIcon />} label="Qavat" hint="Ixtiyoriy">
                  <input className={inputClass} type="number" min={1} max={100} value={roomValues.floor} onChange={(event) => setRoomValues((current) => ({ ...current, floor: event.target.value }))} placeholder="Masalan, 7" />
                </FormField>
                <FormField label="Sig‘imi" required>
                  <input className={inputClass} type="number" min={1} max={2000} required value={roomValues.capacity} onChange={(event) => setRoomValues((current) => ({ ...current, capacity: event.target.value }))} />
                </FormField>
              </div>
              <FormField label="Xona turi" required>
                <select className={selectClass} value={roomValues.kind} onChange={(event) => setRoomValues((current) => ({ ...current, kind: event.target.value as RoomKind }))}>
                  {Object.entries(ROOM_KIND_LABELS).map(([kind, label]) => <option value={kind} key={kind}>{label}</option>)}
                </select>
              </FormField>
            </div>
            <div className="sticky bottom-0 mt-auto flex justify-end gap-2.5 border-t border-slate-100 bg-surface/95 px-6 py-4 backdrop-blur sm:px-8">
              <Button variant="secondary" disabled={savingRoom} onClick={cancelRoomEdit}>Bekor qilish</Button>
              <Button type="submit" loading={savingRoom} loadingText="Saqlanmoqda..." startIcon={<AddRoundedIcon sx={{ fontSize: 17 }} />}>
                {editingRoomId ? 'Xonani saqlash' : 'Xona qo‘shish'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.type === 'building' ? 'Binoni o‘chirasizmi?' : 'Xonani o‘chirasizmi?'}
        description={deleteTarget?.type === 'building'
          ? `“${deleteTarget.name}” binosini o‘chirish uchun avval uning xonalarini o‘chiring.`
          : `“${deleteTarget?.name}” o‘chiriladi. Jadvalga biriktirilgan xonani o‘chirib bo‘lmaydi.`}
        confirmLabel="O‘chirish"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function RoomTile({ room, onEdit, onDelete }: { room: Room; onEdit: () => void; onDelete: () => void }) {
  const status = !room.isActive ? 'off' : room.occupied ? 'busy' : 'free'
  const styles = {
    free: {
      card: 'border-slate-200/80 bg-surface',
      pill: 'bg-emerald-100 text-emerald-700',
      label: 'Bo‘sh',
    },
    busy: {
      card: 'border-orange-200/80 bg-orange-50/70',
      pill: 'bg-orange-200/80 text-orange-800',
      label: 'Band',
    },
    off: {
      card: 'border-slate-200 bg-slate-50',
      pill: 'bg-slate-200 text-slate-600',
      label: 'Mavjud emas',
    },
  }[status]

  return (
    <div
      className={`group relative flex min-h-[7.5rem] flex-col rounded-2xl border p-3.5 transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none ${styles.card}`}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-xl font-extrabold leading-tight tracking-tight text-slate-900">{room.number}</span>
        <div className="-mr-1.5 -mt-1 flex transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
          <button
            type="button"
            className={`grid size-7 place-items-center rounded-lg text-slate-500 hover:bg-surface hover:text-brand-700 ${focusRing}`}
            aria-label={`${room.number}-xonani tahrirlash`}
            onClick={onEdit}
          >
            <EditRoundedIcon sx={{ fontSize: 15 }} />
          </button>
          <button
            type="button"
            className={`grid size-7 place-items-center rounded-lg text-rose-500 hover:bg-surface ${focusRing}`}
            aria-label={`${room.number}-xonani o‘chirish`}
            onClick={onDelete}
          >
            <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
          </button>
        </div>
      </div>

      <p className="mt-0.5 truncate text-sm font-semibold text-slate-700">{ROOM_KIND_LABELS[room.kind]}</p>

      {room.occupied && room.lesson && (
        <p className="mt-1 truncate text-xs text-orange-900/80" title={`${room.lesson.subject}, ${room.lesson.teacher}`}>
          {room.lesson.subject}
          {room.lesson.teacher ? `, ${room.lesson.teacher}` : ''}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600">
          <PeopleAltRoundedIcon sx={{ fontSize: 17 }} className="text-slate-400" />
          {room.capacity}
        </span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${styles.pill}`}>{styles.label}</span>
      </div>
    </div>
  )
}
