import { useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined'
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import LaptopMacOutlinedIcon from '@mui/icons-material/LaptopMacOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded'
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import { api } from '../../lib/api'
import { useAcademicStructure } from '../../hooks/useAcademicStructure'
import useToast from '../../hooks/useToast'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/Pagination'
import { FormField } from '../../components/ui/Field'
import { inputClass } from '../../components/ui/fieldStyles'
import type { AcademicStructureData, Faculty, Department, Direction } from '../../types'
import './structure.css'

type StructureType = keyof AcademicStructureData
type Entry = Faculty | Department | Direction
type Editor = { type: StructureType; item?: Entry; facultyId?: string; departmentId?: string }
const LEVELS = {
  faculties: { label: 'Fakultetlar', singular: 'Fakultet', add: 'Yangi fakultet', icon: AccountBalanceOutlinedIcon },
  departments: { label: 'Kafedralar', singular: 'Kafedra', add: 'Kafedra qo‘shish', icon: LayersOutlinedIcon },
  directions: { label: 'Ta’lim yo‘nalishlari', singular: 'Yo‘nalish', add: 'Yo‘nalish qo‘shish', icon: SchoolOutlinedIcon },
}
const FACULTY_ICONS = [LaptopMacOutlinedIcon, MenuBookOutlinedIcon, AccountBalanceOutlinedIcon, ScienceOutlinedIcon, GroupsOutlinedIcon, SettingsOutlinedIcon]
const number = (value = 0) => new Intl.NumberFormat('uz-UZ').format(value)
const parentFaculty = (item: Entry) => 'faculty' in item ? item.faculty : 'department' in item ? item.department?.faculty : null
const parentDepartment = (item: Entry) => 'department' in item ? item.department : null

export default function StructurePage() {
  const [params] = useSearchParams()
  return <StructureWorkspace key={params.get('tab') || 'faculties'} />
}

function StructureWorkspace() {
  const data = useAcademicStructure()
  const { faculties, departments, directions, isLoading, error, refresh } = data
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const tab: StructureType = requestedTab === 'departments' || requestedTab === 'directions' ? requestedTab : 'faculties'
  const [query, setQuery] = useState('')
  const [facultyFilter, setFacultyFilter] = useState('')
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [selectedId, setSelectedId] = useState('')
  const [detailTab, setDetailTab] = useState<'departments' | 'directions'>('departments')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [menu, setMenu] = useState<{ type: StructureType; item: Entry; anchor: HTMLElement } | null>(null)
  const [confirmation, setConfirmation] = useState<{ type: StructureType; item: Entry; action: 'delete' | 'status' } | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const filtered: Entry[] = data[tab].filter((item) => {
    const matchesName = `${item.name} ${parentFaculty(item)?.name || ''} ${parentDepartment(item)?.name || ''}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
    return matchesName && (!facultyFilter || parentFaculty(item)?.id === facultyFilter)
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / limit))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * limit, currentPage * limit)
  const selected = filtered.find((item) => item.id === selectedId) || visible[0]
  const selectedFacultyId = selected ? (tab === 'faculties' ? selected.id : parentFaculty(selected)?.id) : undefined
  const childDepartments = departments.filter((item) => item.faculty?.id === selectedFacultyId)
  const childDirections = directions.filter((item) => tab === 'departments' ? item.department?.id === selected?.id : item.department?.faculty?.id === selectedFacultyId)
  const detailType = tab === 'faculties' ? detailTab : 'directions'
  const children: Entry[] = detailType === 'departments' ? childDepartments : childDirections
  const LevelIcon = LEVELS[tab].icon

  function changeTab(next: StructureType) {
    setSearchParams({ tab: next })
    setQuery(''); setFacultyFilter(''); setPage(1); setSelectedId(''); setDetailTab('departments')
  }
  function create(type: StructureType, useSelection = false) {
    setEditor({ type, facultyId: useSelection ? selectedFacultyId : facultyFilter || undefined, departmentId: useSelection && tab === 'departments' ? selected?.id : undefined })
  }
  function openConfirmation(action: 'delete' | 'status') {
    if (menu) setConfirmation({ type: menu.type, item: menu.item, action })
    setActionError(''); setMenu(null)
  }
  async function confirmAction() {
    if (!confirmation) return
    setBusy(true); setActionError('')
    const { type, item, action } = confirmation
    try {
      await api(`/academic-structure/${type}/${item.id}`, {
        method: action === 'delete' ? 'DELETE' : 'PATCH',
        ...(action === 'status' ? { body: JSON.stringify({ name: item.name, isActive: !item.isActive }) } : {}),
      })
      await refresh()
      setConfirmation(null)
      toast.success(action === 'delete' ? 'Bo‘lim o‘chirildi.' : 'Bo‘lim holati yangilandi.')
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'Amalni bajarib bo‘lmadi.')
    } finally { setBusy(false) }
  }
  function exportReport() {
    const rows = [
      ['Turi', 'Nomi', 'Fakultet', 'Kafedra', 'Kafedralar', 'Yo‘nalishlar', 'Guruhlar', 'Faol talabalar', 'Holat'],
      ...(['faculties', 'departments', 'directions'] as const).flatMap((type) => data[type].map((item) => [
        LEVELS[type].singular, item.name, parentFaculty(item)?.name || '', parentDepartment(item)?.name || '',
        'departmentCount' in item ? item.departmentCount || 0 : '',
        'directionCount' in item ? item.directionCount || 0 : '', item.groupCount || 0, item.studentCount || 0, item.isActive ? 'Faol' : 'Nofaol',
      ])),
    ]
    // Quote every value, and neutralize spreadsheet formula prefixes in user-entered names.
    const csv = '\uFEFF' + rows.map((row) => row.map((value) => {
      const text = String(value)
      return `"${(/^[=+@\-\t\r]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`
    }).join(';')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url; link.download = 'oxu-talim-tuzilmasi.csv'; link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  function actions(item: Entry, type: StructureType) {
    return <div className="structure-row-actions" onClick={(event) => event.stopPropagation()}>
      <button type="button" className="structure-icon-button" aria-label={`${item.name}ni tahrirlash`} onClick={() => setEditor({ type, item })}><EditOutlinedIcon fontSize="small" /></button>
      <button type="button" className="structure-icon-button" aria-label={`${item.name} uchun boshqa amallar`} aria-haspopup="menu" aria-expanded={menu?.item.id === item.id} onClick={(event) => setMenu({ type, item, anchor: event.currentTarget })}><MoreHorizRoundedIcon fontSize="small" /></button>
    </div>
  }

  return <div className="structure-page mx-auto w-full max-w-[1900px] px-3 pb-6 sm:px-4 lg:px-5">
    <div className="structure-heading">
      <header className="structure-title"><span><AccountBalanceOutlinedIcon /></span><div><h1>Fakultet, kafedra va yo‘nalishlar</h1><p>Fakultetlar, kafedralar va ta’lim yo‘nalishlarini boshqaring.</p></div></header>
      <div className="structure-totals">
        {(['faculties', 'departments', 'directions'] as const).map((type) => {
          const Icon = LEVELS[type].icon
          return <button key={type} className={`structure-total structure-total-${type}`} onClick={() => changeTab(type)}><span className="structure-total-icon"><Icon /></span><span><b>{number(data[type].length)}</b><small>{LEVELS[type].singular === 'Yo‘nalish' ? 'Ta’lim yo‘nalishi' : LEVELS[type].singular}</small></span></button>
        })}
      </div>
    </div>
    <div className="structure-tabs" role="tablist" aria-label="Ta’lim tuzilmasi bo‘limlari">
      {(['faculties', 'departments', 'directions'] as const).map((type) => {
        const Icon = LEVELS[type].icon
        return <button key={type} type="button" role="tab" id={`structure-tab-${type}`} aria-selected={tab === type} aria-controls="structure-panel" className={tab === type ? 'is-active' : ''} onClick={() => changeTab(type)}><Icon /><span>{LEVELS[type].label}</span></button>
      })}
    </div>
    {error && <div className="structure-error" role="alert"><span>{error}</span><Button variant="dangerSoft" size="sm" onClick={() => void refresh()} startIcon={<RefreshRoundedIcon />}>Qayta urinish</Button></div>}
    <div className="structure-workspace" id="structure-panel" role="tabpanel" aria-labelledby={`structure-tab-${tab}`}>
      <Card className="structure-list-panel">
        <div className="structure-list-top"><h2>{LEVELS[tab].label} <span>({number(data[tab].length)})</span></h2><Button startIcon={<AddRoundedIcon />} disabled={isLoading || !!error} onClick={() => create(tab)}>{LEVELS[tab].add}</Button></div>
        <div className="structure-list-tools">
          <label className="structure-search"><SearchRoundedIcon /><input aria-label={`${LEVELS[tab].singular} qidirish`} placeholder={`${LEVELS[tab].singular} nomi bo‘yicha qidirish...`} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} /></label>
          <div className="structure-view-toggle" aria-label="Ko‘rinish">
            <button type="button" aria-label="Kartochka ko‘rinishi" aria-pressed={view === 'grid'} className={view === 'grid' ? 'is-active' : ''} onClick={() => setView('grid')}><GridViewRoundedIcon /></button>
            <button type="button" aria-label="Jadval ko‘rinishi" aria-pressed={view === 'list'} className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')}><ViewListRoundedIcon /></button>
          </div>
        </div>
        {tab !== 'faculties' && <div className="structure-filter"><select aria-label="Fakultet bo‘yicha filtrlash" className={inputClass} value={facultyFilter} onChange={(event) => { setFacultyFilter(event.target.value); setPage(1) }}><option value="">Barcha fakultetlar</option>{faculties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>}
        {isLoading ? <div className="structure-loading" role="status" aria-label="Tuzilma yuklanmoqda">{Array.from({ length: 5 }, (_, index) => <div className="animate-pulse rounded-xl bg-slate-100" key={index} />)}</div> : !filtered.length ? <EmptyState icon={<LevelIcon />} title={query || facultyFilter ? 'Mos ma’lumot topilmadi' : 'Hozircha ma’lumot yo‘q'} description={query || facultyFilter ? 'Qidiruv yoki fakultet filtrini o‘zgartiring.' : 'Yangi bo‘lim qo‘shish tugmasidan foydalaning.'} /> : view === 'list' ?
          <div className="structure-table-scroll"><table className={`structure-table structure-table-${tab}`}><thead><tr><th>№</th><th>{LEVELS[tab].singular} nomi</th>{tab !== 'faculties' && <th>{tab === 'departments' ? 'Fakultet' : 'Kafedra'}</th>}{tab === 'faculties' && <th>Kafedralar</th>}{tab !== 'directions' && <th>Yo‘nalishlar</th>}<th>Talabalar</th><th>Status</th><th>Amallar</th></tr></thead><tbody>
            {visible.map((item, index) => <tr key={item.id} className={selected?.id === item.id ? 'is-selected' : ''} onClick={() => setSelectedId(item.id)}><td>{(currentPage - 1) * limit + index + 1}</td><td><button type="button" className="structure-name" aria-pressed={selected?.id === item.id} onClick={() => setSelectedId(item.id)}><EntryIcon type={tab} index={faculties.findIndex((entry) => entry.id === item.id)} /><b>{item.name}</b></button></td>{tab !== 'faculties' && <td className="structure-parent-name">{tab === 'departments' ? parentFaculty(item)?.name || '—' : parentDepartment(item)?.name || '—'}</td>}{tab === 'faculties' && <td className="structure-count">{number((item as Faculty).departmentCount)}</td>}{tab !== 'directions' && <td className="structure-count">{number((item as Faculty | Department).directionCount)}</td>}<td><span className="structure-student-count"><GroupsOutlinedIcon fontSize="small" />{number(item.studentCount)}</span></td><td><Status active={item.isActive} /></td><td>{actions(item, tab)}</td></tr>)}
          </tbody></table></div> : <div className="structure-grid">{visible.map((item) => <div key={item.id} className={`structure-grid-card ${selected?.id === item.id ? 'is-selected' : ''}`}><button className="structure-grid-select" aria-pressed={selected?.id === item.id} onClick={() => setSelectedId(item.id)}><EntryIcon type={tab} index={faculties.findIndex((entry) => entry.id === item.id)} /><b>{item.name}</b><span>{parentFaculty(item)?.name}</span></button><div className="structure-grid-stats"><span>{tab === 'faculties' ? `${(item as Faculty).departmentCount || 0} kafedra` : `${item.groupCount || 0} guruh`}</span><span>{number(item.studentCount)} talaba</span></div><div className="structure-grid-bottom"><Status active={item.isActive} />{actions(item, tab)}</div></div>)}</div>}
        <div className="structure-list-footer"><label>Sahifada: <select aria-label="Sahifadagi yozuvlar soni" value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1) }}>{[10, 20, 50].map((value) => <option key={value} value={value}>{value} ta</option>)}</select></label><Pagination page={currentPage} totalPages={totalPages} total={filtered.length} limit={limit} onPageChange={setPage} /></div>
      </Card>
      <div className="structure-detail-column">
        {selected && !isLoading ? <>
          <Card className="structure-detail-panel">
            <div className="structure-detail-heading"><EntryIcon type={tab} index={faculties.findIndex((entry) => entry.id === selected.id)} large /><div><h2>{selected.name}</h2><p>{LEVELS[tab].singular} haqida umumiy ma’lumot</p></div><button className="structure-icon-button" aria-label="Tanlangan bo‘lim amallari" aria-haspopup="menu" onClick={(event) => setMenu({ type: tab, item: selected, anchor: event.currentTarget })}><MoreHorizRoundedIcon /></button></div>
            <div className="structure-detail-stats">
              {tab === 'faculties' ? <DetailStat icon={<AccountTreeOutlinedIcon />} value={(selected as Faculty).departmentCount} label="Kafedra" tone="emerald" /> : <DetailStat icon={<GroupsOutlinedIcon />} value={selected.groupCount} label="Guruh" tone="emerald" />}
              {tab !== 'directions' ? <DetailStat icon={<SchoolOutlinedIcon />} value={(selected as Faculty | Department).directionCount} label="Yo‘nalish" tone="brand" /> : <DetailStat icon={<LayersOutlinedIcon />} value={1} label="Kafedra" tone="brand" />}
              <DetailStat icon={<GroupsOutlinedIcon />} value={selected.studentCount} label="Talaba" tone="violet" />
            </div>
            {tab !== 'faculties' && <div className="structure-hierarchy"><span><AccountBalanceOutlinedIcon fontSize="small" />{parentFaculty(selected)?.name || 'Fakultet topilmadi'}</span>{tab === 'directions' && <span><AccountTreeOutlinedIcon fontSize="small" />{parentDepartment(selected)?.name || 'Kafedra topilmadi'}</span>}<Status active={selected.isActive} /></div>}
            {tab !== 'directions' && <>
              <div className="structure-detail-toolbar"><div className="structure-detail-tabs">{tab === 'faculties' && <button className={detailTab === 'departments' ? 'is-active' : ''} onClick={() => setDetailTab('departments')}><LayersOutlinedIcon />Kafedralar ({childDepartments.length})</button>}<button className={detailType === 'directions' ? 'is-active' : ''} onClick={() => setDetailTab('directions')}><SchoolOutlinedIcon />Yo‘nalishlar ({childDirections.length})</button></div><Button variant="secondary" size="sm" startIcon={<AddRoundedIcon />} disabled={!selected.isActive} onClick={() => create(detailType, true)}>{detailType === 'departments' ? 'Kafedra qo‘shish' : 'Yo‘nalish qo‘shish'}</Button></div>
              <div className="structure-children">{children.length ? children.map((item) => <div className="structure-child" key={item.id}><span className="structure-child-icon">{detailType === 'departments' ? <AccountTreeOutlinedIcon /> : <SchoolOutlinedIcon />}</span><div className="structure-child-name"><b>{item.name}</b>{detailType === 'directions' && tab === 'faculties' && <small>{parentDepartment(item)?.name}</small>}{!item.isActive && <small>Nofaol</small>}</div><span className="structure-child-count" title={detailType === 'departments' ? 'Yo‘nalishlar soni' : 'Guruhlar soni'}><GroupsOutlinedIcon fontSize="small" />{detailType === 'departments' ? (item as Department).directionCount || 0 : item.groupCount || 0}</span>{actions(item, detailType)}</div>) : <p className="structure-no-children">Hozircha {detailType === 'departments' ? 'kafedra' : 'yo‘nalish'} qo‘shilmagan.</p>}</div>
            </>}
          </Card>
          <Card className="structure-quick-actions"><h2>Tezkor amallar</h2><div><button onClick={() => setEditor({ type: tab, item: selected })}><EditOutlinedIcon /><span>{LEVELS[tab].singular} ma’lumotlarini tahrirlash</span></button>{tab === 'faculties' && <button disabled={!selected.isActive} onClick={() => create('departments', true)}><AccountTreeOutlinedIcon /><span>Kafedra qo‘shish</span></button>}{tab !== 'directions' && <button disabled={!selected.isActive} onClick={() => create('directions', true)}><SchoolOutlinedIcon /><span>Yo‘nalish qo‘shish</span></button>}<button onClick={exportReport}><FileDownloadOutlinedIcon /><span>Hisobotni yuklab olish</span></button></div><p>Talabalar soni guruhlarga biriktirilgan faol hisoblar asosida hisoblanadi.</p></Card>
        </> : <Card className="p-6"><EmptyState icon={<LevelIcon />} title={isLoading ? 'Ma’lumotlar yuklanmoqda' : 'Bo‘limni tanlang'} description="Tanlangan bo‘lim tafsilotlari shu yerda ko‘rsatiladi." /></Card>}
      </div>
    </div>
    <Menu anchorEl={menu?.anchor} open={!!menu} onClose={() => setMenu(null)} slotProps={{ paper: { sx: { bgcolor: 'var(--color-surface)', color: 'var(--color-slate-700)', border: '1px solid var(--color-slate-200)', borderRadius: 3 } } }}><MenuItem onClick={() => { if (menu) setEditor({ type: menu.type, item: menu.item }); setMenu(null) }}>Tahrirlash</MenuItem><MenuItem onClick={() => openConfirmation('status')}>{menu?.item.isActive ? 'Nofaol qilish' : 'Faollashtirish'}</MenuItem><MenuItem sx={{ color: 'error.main' }} onClick={() => openConfirmation('delete')}>O‘chirish</MenuItem></Menu>
    {editor && <StructureEditor editor={editor} data={data} onClose={() => setEditor(null)} onSaved={async (item) => { await refresh(); if (editor.type === tab) setSelectedId(item.id); setEditor(null); toast.success('Ma’lumotlar saqlandi.') }} />}
    <ConfirmDialog open={!!confirmation} loading={busy} title={confirmation?.action === 'delete' ? 'Bo‘limni o‘chirish' : confirmation?.item.isActive ? 'Bo‘limni nofaol qilish' : 'Bo‘limni faollashtirish'} description={actionError || (confirmation ? `“${confirmation.item.name}” ${confirmation.action === 'delete' ? 'o‘chirilsinmi? Bog‘langan ma’lumotlar mavjud bo‘lsa, o‘chirish bajarilmaydi.' : confirmation.item.isActive ? 'nofaol qilinsinmi? Mavjud bog‘lanishlar saqlanadi.' : 'faollashtirilsinmi?'}` : '')} confirmLabel={confirmation?.action === 'delete' ? 'O‘chirish' : 'Tasdiqlash'} onClose={() => { if (!busy) setConfirmation(null) }} onConfirm={() => void confirmAction()} />
  </div>
}

function EntryIcon({ type, index = 0, large = false }: { type: StructureType; index?: number; large?: boolean }) {
  const position = Math.max(0, index) % FACULTY_ICONS.length
  const Icon = type === 'faculties' ? FACULTY_ICONS[position] : type === 'departments' ? AccountTreeOutlinedIcon : SchoolOutlinedIcon
  return <span className={`structure-entry-icon structure-color-${type === 'faculties' ? position : type === 'departments' ? 1 : 0} ${large ? 'is-large' : ''}`}><Icon /></span>
}
function Status({ active }: { active: boolean }) {
  return <span className={`structure-status ${active ? 'is-active' : ''}`}><i />{active ? 'Faol' : 'Nofaol'}</span>
}
function DetailStat({ icon, value = 0, label, tone }: { icon: ReactNode; value?: number; label: string; tone: string }) {
  return <div className={`structure-detail-stat structure-stat-${tone}`}><span>{icon}</span><div><b>{number(value)}</b><small>{label}</small></div></div>
}

function StructureEditor({ editor, data, onClose, onSaved }: { editor: Editor; data: AcademicStructureData; onClose: () => void; onSaved: (item: Entry) => Promise<void> }) {
  const { type, item } = editor
  const [name, setName] = useState(item?.name || '')
  const [facultyId, setFacultyId] = useState(item ? parentFaculty(item)?.id || '' : editor.facultyId || '')
  const [departmentId, setDepartmentId] = useState(item ? parentDepartment(item)?.id || '' : editor.departmentId || '')
  const [isActive, setIsActive] = useState(item?.isActive ?? true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const close = () => { if (!pending) onClose() }
  const availableDepartments = data.departments.filter((entry) => entry.faculty?.id === facultyId)
  const Icon = LEVELS[type].icon
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) { setError('Bo‘lim nomini kiriting.'); return }
    setPending(true); setError('')
    try {
      const saved = await api<Entry>(`/academic-structure/${type}${item ? '/' + item.id : ''}`, {
        method: item ? 'PATCH' : 'POST',
        body: JSON.stringify({ name: name.trim(), isActive, ...(type === 'departments' ? { facultyId } : {}), ...(type === 'directions' ? { departmentId } : {}) }),
      })
      await onSaved(saved)
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Saqlab bo‘lmadi.') }
    finally { setPending(false) }
  }
  return <Modal open onClose={close} placement="right" size="sm" title={item ? `${LEVELS[type].singular}ni tahrirlash` : LEVELS[type].add} description="Ma’lumotlarni kiriting va saqlang." icon={<Icon />}><form className="flex min-h-full flex-col" onSubmit={(event) => void submit(event)}><div className="flex-1 space-y-5 p-5 sm:p-7">
    {type !== 'faculties' && <FormField label="Fakultet" required htmlFor="structure-faculty"><select id="structure-faculty" className={inputClass} required disabled={pending} value={facultyId} onChange={(event) => { setFacultyId(event.target.value); setDepartmentId('') }}><option value="">Fakultetni tanlang</option>{data.faculties.map((entry) => <option key={entry.id} value={entry.id} disabled={!entry.isActive && entry.id !== (item ? parentFaculty(item)?.id : undefined)}>{entry.name}{!entry.isActive ? ' (nofaol)' : ''}</option>)}</select></FormField>}
    {type === 'directions' && <FormField label="Kafedra" required htmlFor="structure-department"><select id="structure-department" className={inputClass} required disabled={pending || !facultyId} value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}><option value="">Kafedrani tanlang</option>{availableDepartments.map((entry) => <option key={entry.id} value={entry.id} disabled={!entry.isActive && entry.id !== (item ? parentDepartment(item)?.id : undefined)}>{entry.name}{!entry.isActive ? ' (nofaol)' : ''}</option>)}</select>{facultyId && !availableDepartments.length && <p className="mt-2 text-sm text-amber-700">Bu fakultetda avval kafedra yarating.</p>}</FormField>}
    <FormField label={`${LEVELS[type].singular} nomi`} required htmlFor="structure-name"><input id="structure-name" className={inputClass} required maxLength={120} disabled={pending} value={name} onChange={(event) => setName(event.target.value)} placeholder={`${LEVELS[type].singular} nomini kiriting`} /></FormField>
    <label className="flex items-center gap-3 text-sm font-semibold text-slate-700"><input type="checkbox" className="size-5 accent-brand-600" checked={isActive} disabled={pending} onChange={(event) => setIsActive(event.target.checked)} />Faol holat</label>
    {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</p>}
  </div><div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-surface p-5"><Button variant="secondary" disabled={pending} onClick={close}>Bekor qilish</Button><Button type="submit" loading={pending} loadingText="Saqlanmoqda...">Saqlash</Button></div></form></Modal>
}
