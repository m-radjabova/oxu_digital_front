import FilterSelect from '../../components/ui/FilterSelect'
import MetricCard from '../../components/ui/MetricCard'
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded'
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import { useMemo, useState, type ReactNode } from 'react'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import BlockRoundedIcon from '@mui/icons-material/BlockRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded'
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded'
import { useGroups } from '../../hooks/useGroups'
import { useSubjects } from '../../hooks/useSubjects'
import { useAcademicStructure } from '../../hooks/useAcademicStructure'
import type { Group } from '../../types'
import useToast from '../../hooks/useToast'
import PageHeading from '../../components/PageHeading'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card, { SectionHeader } from '../../components/ui/Card'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EditGroupDialog, { type GroupValues } from '../../components/EditGroupDialog'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import MultiSelect from '../../components/ui/MultiSelect'
import Pagination from '../../components/Pagination'
import { inputBase } from '../../components/ui/fieldStyles'
import { RowAction, SegmentedFilter, StatusPill, Table, TableSkeleton, Td, Th, Tr } from '../../components/ui/Table'

type StatusFilter = 'all' | 'active' | 'inactive'

const COLUMNS = 7

export default function GroupsPage() {
  const toast = useToast()
  const { data: groups, isLoading, error, refresh, createGroup, updateGroup, setGroupActive, addGroupSubjects } = useGroups()
  const { data: subjects, isLoading: subjectsLoading, error: subjectsError, refresh: refreshSubjects } = useSubjects()
  const { directions, faculties } = useAcademicStructure()
  const [query, setQuery] = useState('')
  const [yearFilter, setYearFilter] = useState<'all' | number>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [facultyFilter, setFacultyFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [view, setView] = useState<'table' | 'grid'>('table')
  const [assignGroup, setAssignGroup] = useState<Group | null>(null)
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([])
  const [assigning, setAssigning] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [statusTarget, setStatusTarget] = useState<Group | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const activeCount = groups.filter((group) => group.isActive !== false).length
  const inactiveCount = groups.length - activeCount
  const years = useMemo(
    () => [...new Set(groups.map((group) => group.year))].sort((a, b) => a - b),
    [groups],
  )
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return groups.filter((group) => {
      const isActive = group.isActive !== false
      return (
        (yearFilter === 'all' || group.year === yearFilter) &&
        (facultyFilter === 'all' || group.direction?.department?.faculty?.id === facultyFilter) &&
        (statusFilter === 'all' || (statusFilter === 'active' ? isActive : !isActive)) &&
        (!normalizedQuery ||
          group.name.toLowerCase().includes(normalizedQuery) ||
          group.direction?.name.toLowerCase().includes(normalizedQuery))
      )
    })
  }, [groups, query, yearFilter, statusFilter, facultyFilter])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleGroups = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const hasFilters = Boolean(query.trim()) || yearFilter !== 'all' || statusFilter !== 'all' || facultyFilter !== 'all'
  const availableSubjects = subjects.filter((subject) => assignGroup && subject.course === assignGroup.year && subject.semester === 1 && (!subject.direction || subject.direction.id === assignGroup.direction?.id) && (subject.educationForm || 'full-time') === (assignGroup.educationForm || 'full-time') && !subject.groups?.some((group) => group.id === assignGroup.id))

  function clearFilters() {
    setQuery('')
    setYearFilter('all')
    setStatusFilter('all')
    setFacultyFilter('all')
    setPage(1)
  }

  async function handleCreateGroup(values: GroupValues, assignSubjects = false) {
    setIsSaving(true)
    try {
      const group = await createGroup(values)
      toast.success(`“${values.name}” guruhi yaratildi.`, 'Guruh qo‘shildi')
      setIsCreating(false)
      if (assignSubjects) { setSelectedSubjectIds([]); setAssignGroup(group) }
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Guruhni yaratib bo‘lmadi.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleAssignSubjects() {
    if (!assignGroup || !selectedSubjectIds.length) return
    setAssigning(true)
    try {
      await addGroupSubjects(assignGroup.id, selectedSubjectIds)
      toast.success(`${selectedSubjectIds.length} ta fan “${assignGroup.name}” guruhiga biriktirildi.`, 'Fanlar biriktirildi')
      setAssignGroup(null)
      setSelectedSubjectIds([])
      void refreshSubjects()
    } catch (requestError) { toast.error(requestError instanceof Error ? requestError.message : 'Fanlarni biriktirib bo‘lmadi.') } finally { setAssigning(false) }
  }

  async function handleUpdateGroup(values: GroupValues) {
    if (!editingGroup) return
    setIsSaving(true)
    try {
      await updateGroup(editingGroup.id, values)
      toast.success(`“${values.name}” guruhi yangilandi.`, 'Saqlandi')
      setEditingGroup(null)
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Guruhni yangilab bo‘lmadi.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleStatus() {
    if (!statusTarget) return
    const nextStatus = !(statusTarget.isActive !== false)
    setIsUpdatingStatus(true)
    try {
      await setGroupActive(statusTarget.id, nextStatus)
      toast.success(
        nextStatus ? `“${statusTarget.name}” guruhi faollashtirildi.` : `“${statusTarget.name}” guruhi nofaol qilindi.`,
        nextStatus ? 'Faollashtirildi' : 'Nofaol qilindi',
      )
      setStatusTarget(null)
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Guruh holatini o‘zgartirib bo‘lmadi.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-3 pb-5 sm:px-4 lg:px-5 lg:pb-6">
      <PageHeading
        eyebrow="Ta’lim tuzilmasi"
        title="Guruhlar"
        description="Talabalarni guruhlar bo‘yicha tartiblang va dars jadvaliga asos yarating."
        icon={<GroupsRoundedIcon />}
        action={<Button startIcon={<AddRoundedIcon />} onClick={() => setIsCreating(true)}>Yangi guruh qo‘shish</Button>}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={<GroupsRoundedIcon sx={{ fontSize: 18 }} />} label="Jami guruhlar" value={groups.length} tone="brand" />
        <StatTile icon={<SchoolRoundedIcon sx={{ fontSize: 18 }} />} label="Jami talabalar" value={groups.reduce((sum, group) => sum + (group.studentCount || 0), 0)} tone="info" />
        <StatTile icon={<AccountBalanceRoundedIcon sx={{ fontSize: 18 }} />} label="Fakultet" value={faculties.length} tone="success" />
        <StatTile icon={<ExploreRoundedIcon sx={{ fontSize: 18 }} />} label="Ta’lim yo‘nalishlari" value={directions.length} tone="neutral" />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-3 sm:p-4">
          <SectionHeader
            icon={<GroupsRoundedIcon sx={{ fontSize: 18 }} />}
            title="Mavjud guruhlar"
            description={`${groups.length} ta guruh · ${activeCount} faol`}
          />

          <div className="mt-5 flex flex-col gap-2.5 xl:flex-row xl:flex-wrap xl:items-center">
            <div className="relative min-w-0 flex-1">
              <SearchRoundedIcon sx={{ fontSize: 18 }} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className={`filter-search ${inputBase} h-10 pl-10 pr-10`}
                placeholder="Guruh yoki yo‘nalish nomi bo‘yicha qidirish..."
                value={query}
                onChange={(event) => { setQuery(event.target.value); setPage(1) }}
                aria-label="Guruhlarni qidirish"
              />
              {query && (
                <button
                  type="button"
                  className="absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Qidiruvni tozalash"
                  onClick={() => setQuery('')}
                >
                  <CloseRoundedIcon sx={{ fontSize: 16 }} />
                </button>
              )}
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
              <SegmentedFilter
                ariaLabel="Holat bo‘yicha filtr"
                value={statusFilter}
                onChange={(value) => { setStatusFilter(value); setPage(1) }}
                options={[
                  { value: 'all', label: 'Barchasi', count: groups.length },
                  { value: 'active', label: 'Faol', count: activeCount },
                  { value: 'inactive', label: 'Nofaol', count: inactiveCount },
                ]}
              />
              <div className="w-full sm:w-44">
                <FilterSelect icon={<SchoolRoundedIcon />}
                  className={`${inputBase} h-10 cursor-pointer pr-3`}
                  value={yearFilter}
                  onChange={(event) => { setYearFilter(event.target.value === 'all' ? 'all' : Number(event.target.value)); setPage(1) }}
                  aria-label="Kurs bo‘yicha filtr"
                >
                  <option value="all">Barcha kurslar</option>
                  {years.map((year) => <option value={year} key={year}>{year}-kurs</option>)}
                </FilterSelect>
              </div>
              <div className="w-full sm:w-52"><FilterSelect icon={<AccountBalanceRoundedIcon />} className={`${inputBase} h-10 cursor-pointer pr-3`} value={facultyFilter} onChange={(event) => { setFacultyFilter(event.target.value); setPage(1) }} aria-label="Fakultet bo‘yicha filtr"><option value="all">Fakultet: barchasi</option>{faculties.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name}</option>)}</FilterSelect></div>
              <div className="inline-flex rounded-xl border border-slate-200 bg-surface p-1" role="group" aria-label="Ko‘rinish"><button type="button" title="Jadval" aria-label="Jadval ko‘rinishi" aria-pressed={view === 'table'} onClick={() => setView('table')} className={`grid size-8 place-items-center rounded-lg ${view === 'table' ? 'bg-brand-50 text-brand-700' : 'text-slate-400'}`}><ViewListRoundedIcon sx={{ fontSize: 20 }} /></button><button type="button" title="Kartalar" aria-label="Kartalar ko‘rinishi" aria-pressed={view === 'grid'} onClick={() => setView('grid')} className={`grid size-8 place-items-center rounded-lg ${view === 'grid' ? 'bg-brand-50 text-brand-700' : 'text-slate-400'}`}><GridViewRoundedIcon sx={{ fontSize: 19 }} /></button></div>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-100 bg-rose-50 px-5 py-3 text-xs text-rose-800 sm:px-6">
            <span className="flex items-center gap-1.5"><ErrorOutlineRoundedIcon sx={{ fontSize: 15 }} />{error}</span>
            <Button variant="dangerSoft" size="sm" startIcon={<RefreshRoundedIcon sx={{ fontSize: 14 }} />} onClick={() => void refresh()}>
              Qayta urinish
            </Button>
          </div>
        )}

        {isLoading && groups.length === 0 ? (
          <Table caption="Guruhlar yuklanmoqda">
            <GroupsTableHead />
            <TableSkeleton rows={6} columns={COLUMNS} />
          </Table>
        ) : filtered.length && view === 'grid' ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3 sm:p-6">{visibleGroups.map((group) => <div key={group.id} className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><span className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700">{group.name}</span><StatusPill active={group.isActive !== false} /></div><h3 className="mt-4 font-bold text-slate-900">{group.direction?.name || 'Yo‘nalish biriktirilmagan'}</h3><p className="mt-1 text-xs text-slate-500">{group.direction?.department?.name || 'Kafedra ko‘rsatilmagan'}</p><div className="mt-4 flex justify-between border-t border-slate-100 pt-3 text-sm text-slate-600"><span>{group.year}-kurs</span><span>{group.studentCount ?? 0} / {group.studentLimit ?? 30} talaba</span></div><div className="mt-3 flex justify-end border-t border-slate-100 pt-2">{group.isActive !== false && <RowAction label={`${group.name} guruhiga fan biriktirish`} onClick={() => { setSelectedSubjectIds([]); setAssignGroup(group) }}><MenuBookRoundedIcon sx={{ fontSize: 18 }} /></RowAction>}<RowAction label={`${group.name} guruhini tahrirlash`} onClick={() => setEditingGroup(group)}><EditRoundedIcon sx={{ fontSize: 18 }} /></RowAction><RowAction label={`${group.name} guruh holatini o‘zgartirish`} tone={group.isActive !== false ? 'danger' : 'success'} onClick={() => setStatusTarget(group)}>{group.isActive !== false ? <BlockRoundedIcon sx={{ fontSize: 18 }} /> : <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />}</RowAction></div></div>)}</div>
        ) : filtered.length ? (
          <Table caption="Guruhlar ro‘yxati">
            <GroupsTableHead />
            <tbody>
              {visibleGroups.map((group, index) => {
                const isActive = group.isActive !== false
                return (
                  <Tr key={group.id} className={isActive ? '' : 'opacity-75'}>
                    <Td className="w-12 text-xs font-semibold tabular-nums text-slate-400">{(currentPage - 1) * pageSize + index + 1}</Td>
                    <Td>
                      <span className="flex items-center gap-3">
                        <span
                          className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold ${
                            isActive ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {group.name}
                        </span>
                        <span className="min-w-0">
                          <strong className="block max-w-[260px] truncate text-sm font-semibold text-slate-800">{group.name}</strong>
                          <small className="mt-0.5 block text-xs text-slate-400">{group.year}-kurs talabalari</small>
                        </span>
                      </span>
                    </Td>
                    <Td>
                      <Badge tone="info">{group.year}-kurs</Badge>
                    </Td>
                    <Td>
                      {group.direction ? (
                        <span className="block min-w-0">
                          <span className="block max-w-[300px] truncate text-sm font-medium text-slate-700">{group.direction.name}</span>
                          {group.direction.department?.name && (
                            <small className="mt-0.5 block max-w-[300px] truncate text-xs text-slate-400">{group.direction.department.name}</small>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-amber-600">Biriktirilmagan</span>
                      )}
                    </Td>
                    <Td><span className="font-semibold text-slate-700">{group.studentCount ?? 0}</span><small className="text-slate-400"> / {group.studentLimit ?? 30}</small></Td>
                    <Td>
                      <StatusPill active={isActive} />
                    </Td>
                    <Td className="text-right">
                      <span className="inline-flex items-center gap-0.5">
                        {isActive && <RowAction label={`${group.name} guruhiga fan biriktirish`} onClick={() => { setSelectedSubjectIds([]); setAssignGroup(group) }}><MenuBookRoundedIcon sx={{ fontSize: 18 }} /></RowAction>}
                        <RowAction label={`${group.name} guruhini tahrirlash`} onClick={() => setEditingGroup(group)}>
                          <EditRoundedIcon sx={{ fontSize: 18 }} />
                        </RowAction>
                        <RowAction
                          label={isActive ? `${group.name} guruhini nofaol qilish` : `${group.name} guruhini faollashtirish`}
                          tone={isActive ? 'danger' : 'success'}
                          onClick={() => setStatusTarget(group)}
                        >
                          {isActive ? <BlockRoundedIcon sx={{ fontSize: 18 }} /> : <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />}
                        </RowAction>
                      </span>
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        ) : (
          <EmptyState
            icon={<GroupsRoundedIcon />}
            title={groups.length ? 'Filtrga mos guruh yo‘q' : 'Hali guruhlar yo‘q'}
            description={groups.length ? 'Qidiruv so‘zini o‘zgartiring yoki filtrlarni tozalang.' : '“Yangi guruh” tugmasi orqali birinchi guruhni yarating.'}
            action={groups.length ? (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Filtrlarni tozalash
              </Button>
            ) : (
              <Button size="sm" startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />} onClick={() => setIsCreating(true)}>
                Yangi guruh
              </Button>
            )}
          />
        )}

        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="flex items-start gap-1.5">
            <InfoOutlinedIcon sx={{ fontSize: 15 }} className="mt-px shrink-0 text-slate-400" />
            Nofaol guruhning darslari va talabalari saqlanadi, faqat unga yangi dars qo‘shib bo‘lmaydi.
          </p>
          <p className="shrink-0 font-medium">
            {hasFilters ? (
              <>
                <b className="font-bold text-slate-700">{filtered.length}</b> / {groups.length} ta ko‘rsatilmoqda
                <button type="button" className="ml-2 font-semibold text-brand-600 hover:text-brand-700" onClick={clearFilters}>
                  Tozalash
                </button>
              </>
            ) : (
              <><b className="font-bold text-slate-700">{groups.length}</b> ta guruh</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-5 py-4 sm:px-6"><label className="flex items-center gap-2 text-xs font-medium text-slate-500">Sahifada: <select className={`${inputBase} h-9 w-20`} value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value={10}>10 ta</option><option value={20}>20 ta</option><option value={50}>50 ta</option></select></label><Pagination page={currentPage} totalPages={totalPages} total={filtered.length} limit={pageSize} onPageChange={setPage} /></div>
      </Card>

      {isCreating && (
        <EditGroupDialog
          directions={directions}
          busy={isSaving}
          onClose={() => setIsCreating(false)}
          onSave={handleCreateGroup}
        />
      )}

      {editingGroup && (
        <EditGroupDialog
          group={editingGroup}
          directions={directions}
          busy={isSaving}
          onClose={() => setEditingGroup(null)}
          onSave={handleUpdateGroup}
        />
      )}

      <Modal open={Boolean(assignGroup)} onClose={() => { if (!assigning) setAssignGroup(null) }} title="Fanlarni guruhga biriktirish" description={assignGroup ? `“${assignGroup.name}” uchun mos 1-semestr fanlarini tanlang.` : undefined} icon={<MenuBookRoundedIcon />}>
        <div className="p-5 sm:p-7">{subjectsError && <div className="mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{subjectsError} <button type="button" className="underline" onClick={() => void refreshSubjects()}>Qayta urinish</button></div>}<MultiSelect disabled={subjectsLoading || assigning} options={availableSubjects.map((subject) => ({ id: subject.id, label: subject.name, hint: `${subject.code || 'Kodsiz'} · ${subject.course}-kurs` }))} value={selectedSubjectIds} onChange={setSelectedSubjectIds} placeholder={subjectsLoading ? 'Fanlar yuklanmoqda...' : 'Fanlarni tanlang'} emptyText="Mos 1-semestr fanlari topilmadi yoki ular allaqachon biriktirilgan." ariaLabel="Guruhga biriktiriladigan fanlar" /><p className="mt-3 text-xs leading-5 text-slate-500">Faqat guruh kursi, yo‘nalishi va ta’lim shakliga mos fanlar ko‘rsatiladi. Keyinchalik ham fan biriktirish mumkin.</p><div className="mt-6 flex justify-end gap-3"><Button variant="secondary" disabled={assigning} onClick={() => setAssignGroup(null)}>Yopish</Button><Button loading={assigning} disabled={!selectedSubjectIds.length} onClick={() => void handleAssignSubjects()}>Biriktirish</Button></div></div>
      </Modal>

      {statusTarget && (
        <ConfirmDialog
          open
          tone={statusTarget.isActive !== false ? 'danger' : 'brand'}
          title={statusTarget.isActive !== false ? 'Guruhni nofaol qilasizmi?' : 'Guruhni faollashtirasizmi?'}
          description={
            statusTarget.isActive !== false
              ? `“${statusTarget.name}” guruhi nofaol qilinadi. Guruh, unga biriktirilgan talabalar va mavjud darslar o‘chirilmaydi — faqat bu guruhga yangi dars qo‘shib bo‘lmaydi. Keyin uni qayta faollashtirish mumkin.`
              : `“${statusTarget.name}” guruhi yana faollashadi va unga yangi dars qo‘shish mumkin bo‘ladi.`
          }
          confirmLabel={statusTarget.isActive !== false ? 'Nofaol qilish' : 'Faollashtirish'}
          loading={isUpdatingStatus}
          onConfirm={() => void handleToggleStatus()}
          onClose={() => { if (!isUpdatingStatus) setStatusTarget(null) }}
        />
      )}
    </div>
  )
}

function GroupsTableHead() {
  return (
    <thead>
      <tr>
        <Th className="w-12">#</Th>
        <Th icon={<GroupsRoundedIcon />}>Guruh</Th>
        <Th icon={<SchoolRoundedIcon />}>Kurs</Th>
        <Th icon={<AccountTreeRoundedIcon />}>Yo‘nalish</Th>
        <Th icon={<PeopleRoundedIcon />}>Talabalar</Th>
        <Th icon={<VerifiedRoundedIcon />}>Holat</Th>
        <Th className="text-right" icon={<TuneRoundedIcon />}>Amallar</Th>
      </tr>
    </thead>
  )
}

function StatTile({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: ReactNode
  label: string
  value: number
  hint?: string
  tone: 'brand' | 'info' | 'success' | 'neutral'
}) {
  return <MetricCard icon={icon} label={label} value={value} hint={hint} tone={({ brand: 'brand', info: 'sky', success: 'emerald', neutral: 'slate' } as const)[tone]} />
}
