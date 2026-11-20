import FilterSelect from '../../components/ui/FilterSelect'
import LayersRoundedIcon from '@mui/icons-material/LayersRounded'
import { useCallback, useMemo, useState, type FormEvent } from 'react'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import { useLocation } from 'react-router-dom'
import Pagination from '../../components/Pagination'
import { api } from '../../lib/api'
import useApiResource from '../../hooks/useApiResource'
import useToast from '../../hooks/useToast'
import type { Building, Room, RoomKind } from '../../types'
import { startOfWeek, toDateKey } from '../../utils/date'
import { PERIODS } from '../../utils/periods'
import PageHeading from '../../components/PageHeading'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import { FormField } from '../../components/ui/Field'
import { inputClass, selectClass } from '../../components/ui/fieldStyles'
import Modal from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import { FacadeIllustration } from './CampusIllustrations'

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
  const location = useLocation()
  const [weekStart, setWeekStart] = useState(() => toDateKey(startOfWeek(new Date())))
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [period, setPeriod] = useState(1)
  const [selectedBuildingId, setSelectedBuildingId] = useState(() => new URLSearchParams(location.search).get('building') || '')
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
  function selectBuilding(id: string) {
    setSelectedBuildingId(id)
    cancelRoomEdit()
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

  const [buildingSearch, setBuildingSearch] = useState('')
  const [roomSearch, setRoomSearch] = useState('')
  const [kindFilter, setKindFilter] = useState('all')
  const [floorFilter, setFloorFilter] = useState('all')
  const [roomPage, setRoomPage] = useState(1)
  const [gridView, setGridView] = useState(false)
  const filteredRooms = rooms.filter(room => (kindFilter === 'all' || room.kind === kindFilter) && (floorFilter === 'all' || String(room.floor ?? 'none') === floorFilter) && `${room.number} ${ROOM_KIND_LABELS[room.kind]}`.toLocaleLowerCase().includes(roomSearch.toLocaleLowerCase()))
  const currentPage = Math.min(roomPage, Math.max(1, Math.ceil(filteredRooms.length / 10)))
  const pageRooms = filteredRooms.slice((currentPage - 1) * 10, currentPage * 10)
  const allRooms = buildings.flatMap(building => building.rooms)
  return (
    <div className="mx-auto w-full max-w-[1800px] px-3 pb-8 sm:px-5">
      <PageHeading eyebrow="Universitet infratuzilmasi" title="Binolar va xonalar" description="Universitet binolari va ulardagi xonalarni boshqaring." icon={<ApartmentRoundedIcon />} />
      {loadError && <div role="alert" className="mb-4 flex items-center justify-between rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{loadError}<Button variant="ghost" onClick={() => void refresh()}>Qayta urinish</Button></div>}
      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">{[
        { label: 'Jami bino', value: buildings.length, icon: <ApartmentRoundedIcon />, tone: 'bg-violet-100 text-violet-600' },
        { label: 'Jami xona', value: allRooms.length, icon: <MeetingRoomRoundedIcon />, tone: 'bg-emerald-100 text-emerald-600' },
        { label: 'O‘quv xonasi', value: allRooms.filter(room => room.kind !== 'multi').length, icon: <PeopleAltRoundedIcon />, tone: 'bg-blue-100 text-blue-600' },
        { label: 'Universal xona', value: allRooms.filter(room => room.kind === 'multi').length, icon: <LayersRoundedIcon />, tone: 'bg-orange-100 text-orange-600' },
      ].map(stat => <Card key={stat.label} className="flex items-center gap-3 p-4"><span className={`grid size-12 shrink-0 place-items-center rounded-xl ${stat.tone}`}>{stat.icon}</span><div>{isLoading && !buildings.length ? <Skeleton className="h-7 w-12" /> : <b className="text-2xl text-slate-900">{stat.value}</b>}<p className="text-xs text-slate-500">{stat.label}</p></div></Card>)}</div>
      <div className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[330px_minmax(0,1fr)]">
        <Card className="p-4"><div className="mb-4 flex items-center justify-between gap-2"><h2 className="text-lg font-bold text-slate-900">Binolar ({buildings.length})</h2><Button size="sm" startIcon={<AddRoundedIcon />} onClick={() => openBuildingForm()}>Yangi bino</Button></div>
          <input className={inputClass} aria-label="Bino nomini qidirish" placeholder="Bino nomini qidirish..." value={buildingSearch} onChange={event => setBuildingSearch(event.target.value)} />
          <div className="mt-4 max-h-[760px] space-y-3 overflow-y-auto">{isLoading && !buildings.length ? Array.from({length: 4}, (_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />) : buildings.filter(building => building.name.toLocaleLowerCase().includes(buildingSearch.toLocaleLowerCase())).map(building => <button key={building.id} type="button" aria-pressed={selectedBuilding?.id === building.id} onClick={() => { selectBuilding(building.id); setRoomPage(1); setFloorFilter('all') }} className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${selectedBuilding?.id === building.id ? 'border-brand-400 bg-brand-50 ring-1 ring-brand-200' : 'border-slate-100 hover:border-brand-200'}`}><div className="w-24 shrink-0 overflow-hidden rounded-lg bg-sky-50"><FacadeIllustration /></div><div className="min-w-0 flex-1"><h3 className="break-words font-bold text-slate-900">{building.name}</h3><p className="mt-1 truncate text-xs text-slate-500">{building.address || 'Manzil kiritilmagan'}</p><div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600"><span>{building.rooms.length} xona</span><Badge tone={building.isActive ? 'success' : 'neutral'}>{building.isActive ? 'Faol' : 'Nofaol'}</Badge></div></div></button>)}</div>
          {!isLoading && !buildings.length && <EmptyState title="Binolar mavjud emas" description="Yangi bino qo‘shishdan boshlang." />}
        </Card>
        <Card className="min-w-0 overflow-hidden p-4 sm:p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><ApartmentRoundedIcon className="text-brand-600" sx={{ fontSize: 32 }} /><div><h2 className="text-lg font-bold text-slate-900">{selectedBuilding ? `${selectedBuilding.name} xonalari (${rooms.length})` : 'Xonalar'}</h2><p className="mt-1 text-xs text-slate-500">{selectedBuilding?.address || 'Binoni chapdagi ro‘yxatdan tanlang'}</p></div></div><div className="flex gap-2"><Button variant="secondary" size="sm" disabled={!selectedBuilding} startIcon={<EditRoundedIcon />} onClick={() => selectedBuilding && startBuildingEdit(selectedBuilding)}>Bino ma’lumotlari</Button><Button size="sm" disabled={!selectedBuilding} startIcon={<AddRoundedIcon />} onClick={() => openRoomForm()}>Yangi xona</Button><Button variant="dangerSoft" size="sm" disabled={!selectedBuilding} aria-label="Binoni o‘chirish" onClick={() => selectedBuilding && setDeleteTarget({ type: 'building', id: selectedBuilding.id, name: selectedBuilding.name })}><DeleteOutlineRoundedIcon sx={{fontSize:18}} /></Button></div></div>
          <div className="mb-4 flex flex-wrap gap-2">{[['all', 'Barcha xonalar'], ...Object.entries(ROOM_KIND_LABELS)].map(([kind, label]) => <button type="button" key={kind} onClick={() => { setKindFilter(kind); setRoomPage(1) }} aria-pressed={kindFilter === kind} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${kindFilter === kind ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 text-slate-600 hover:bg-brand-50'}`}>{label} ({kind === 'all' ? rooms.length : rooms.filter(room => room.kind === kind).length})</button>)}</div>
          <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px_auto]"><input className={inputClass} aria-label="Xona qidirish" placeholder="Xona raqami yoki turi bo‘yicha qidirish..." value={roomSearch} onChange={event => { setRoomSearch(event.target.value); setRoomPage(1) }} /><FilterSelect aria-label="Qavat" icon={<LayersRoundedIcon />} className={selectClass} value={floorFilter} onChange={event => { setFloorFilter(event.target.value); setRoomPage(1) }}><option value="all">Barcha qavatlar</option>{floorGroups.map(floor => <option key={floor.key} value={floor.key}>{floor.label}</option>)}</FilterSelect><Button variant="secondary" onClick={() => setGridView(!gridView)}>{gridView ? 'Jadval' : 'Kartalar'}</Button></div>
          <details className="mb-4 rounded-xl border border-slate-200 p-3"><summary className="cursor-pointer text-xs font-semibold text-slate-600">Bandlik vaqti · {DAYS.find(day => day.value === dayOfWeek)?.label}, {period}-para</summary><div className="mt-3 grid gap-3 sm:grid-cols-3"><input type="date" aria-label="Bandlik haftasi" className={inputClass} value={weekStart} onChange={event => { if(event.target.value) setWeekStart(toDateKey(startOfWeek(event.target.value))) }} /><FilterSelect aria-label="Kun" value={dayOfWeek} onChange={event => setDayOfWeek(Number(event.target.value))}>{DAYS.map(day => <option key={day.value} value={day.value}>{day.label}</option>)}</FilterSelect><FilterSelect aria-label="Para" value={period} onChange={event => setPeriod(Number(event.target.value))}>{PERIODS.map(item => <option key={item.number} value={item.number}>{item.number}-para · {item.start}</option>)}</FilterSelect></div></details>
          {isLoading ? <div role="status" aria-label="Xonalar yuklanmoqda" className="space-y-3">{Array.from({length: 6}, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div> : !pageRooms.length ? <EmptyState icon={<MeetingRoomRoundedIcon />} title="Xonalar topilmadi" description="Qidiruv va filtrlarni o‘zgartiring yoki yangi xona qo‘shing." /> : gridView ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{pageRooms.map(room => <RoomTile key={room.id} room={room} onEdit={() => startRoomEdit(room)} onDelete={() => setDeleteTarget({type: 'room', id: room.id, name: room.number})} />)}</div> : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Xona №', 'Turi', 'Sig‘im', 'Qavat', 'Holat', 'Amallar'].map(label => <th key={label} className="px-3 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>{pageRooms.map(room => <tr key={room.id} className="border-b border-slate-100 even:bg-slate-50/50"><td className="px-3 py-3 font-bold text-slate-900">{room.number}</td><td className="px-3 py-3"><span className="rounded-md bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">{ROOM_KIND_LABELS[room.kind]}</span></td><td className="px-3 py-3 text-slate-600">{room.capacity} o‘rin</td><td className="px-3 py-3 text-slate-600">{room.floor ? `${room.floor}-qavat` : 'Belgilanmagan'}</td><td className="px-3 py-3"><Badge tone={!room.isActive ? 'neutral' : room.occupied ? 'warning' : 'success'}>{!room.isActive ? 'Nofaol' : room.occupied ? 'Band' : 'Bo‘sh'}</Badge></td><td className="px-3 py-3"><div className="flex gap-1"><button aria-label={`${room.number}-xonani tahrirlash`} className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:text-brand-600" onClick={() => startRoomEdit(room)}><EditRoundedIcon sx={{fontSize:17}} /></button><button aria-label={`${room.number}-xonani o‘chirish`} className="rounded-lg border border-slate-200 p-1.5 text-rose-500" onClick={() => setDeleteTarget({type: 'room', id: room.id, name: room.number})}><DeleteOutlineRoundedIcon sx={{fontSize:17}} /></button></div></td></tr>)}</tbody></table></div>}
          <div className="mt-4"><Pagination page={currentPage} totalPages={Math.max(1, Math.ceil(filteredRooms.length / 10))} total={filteredRooms.length} limit={10} onPageChange={setRoomPage} /></div>
        </Card>
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
