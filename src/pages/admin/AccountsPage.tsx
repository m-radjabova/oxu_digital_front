import MetricCard from '../../components/ui/MetricCard'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded'
import LinkRoundedIcon from '@mui/icons-material/LinkRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import { useEffect, useState, type ReactNode } from 'react'
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ClassRoundedIcon from '@mui/icons-material/ClassRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import BlockRoundedIcon from '@mui/icons-material/BlockRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import { useGroups } from '../../hooks/useGroups'
import { useSubjects } from '../../hooks/useSubjects'
import { useAcademicStructure } from '../../hooks/useAcademicStructure'
import { PAGE_SIZE, usePaginatedUsers, type UserUpdateInput } from '../../hooks/usePaginatedUsers'
import type { Direction, Subject, User } from '../../types'
import useToast from '../../hooks/useToast'
import PageHeading from '../../components/PageHeading'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card, { SectionHeader } from '../../components/ui/Card'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import CreateAccountDialog from '../../components/CreateAccountDialog'
import EditAccountDialog from '../../components/EditAccountDialog'
import EmptyState from '../../components/ui/EmptyState'
import { inputBase } from '../../components/ui/fieldStyles'
import { RowAction, SegmentedFilter, StatusPill, Table, TableSkeleton, Td, Th, Tr } from '../../components/ui/Table'
import Pagination from '../../components/Pagination'

type RoleFilter = 'all' | 'teacher' | 'student'

const COLUMNS = 6

export default function AccountsPage() {
  const toast = useToast()
  const { data: groups } = useGroups()
  const { data: subjects } = useSubjects()
  const { directions } = useAcademicStructure()
  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const {
    data: usersPage,
    isLoading,
    error,
    refresh,
    createUser,
    updateUser,
    setUserActive,
  } = usePaginatedUsers(roleFilter === 'all' ? undefined : roleFilter, page, { search })
  const users = usersPage.items
  const counts = usersPage.counts
  const [isCreating, setIsCreating] = useState(false)
  const [editingAccount, setEditingAccount] = useState<User | null>(null)
  const [statusTarget, setStatusTarget] = useState<User | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const hasFilters = Boolean(search) || roleFilter !== 'all'

  // Qidiruv har bir harfda emas, yozish to'xtaganidan keyin serverga yuboriladi
  useEffect(() => {
    const next = searchInput.trim()
    if (next === search) return
    const timer = window.setTimeout(() => {
      setSearch(next)
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchInput, search])

  function changeRole(next: RoleFilter) {
    setRoleFilter(next)
    setPage(1)
  }

  function clearFilters() {
    setSearchInput('')
    setSearch('')
    setRoleFilter('all')
    setPage(1)
  }

  async function handleUpdateAccount(values: UserUpdateInput) {
    if (!editingAccount) return
    setIsSaving(true)
    try {
      await updateUser(editingAccount.id, values)
      toast.success(`“${values.name}” hisobi yangilandi.`, 'Saqlandi')
      setEditingAccount(null)
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Hisobni yangilab bo‘lmadi.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleStatus() {
    if (!statusTarget) return
    const nextStatus = !statusTarget.isActive
    setIsUpdatingStatus(true)
    try {
      await setUserActive(statusTarget.id, nextStatus)
      toast.success(
        nextStatus ? `“${statusTarget.name}” hisobi faollashtirildi.` : `“${statusTarget.name}” hisobi nofaol qilindi.`,
        nextStatus ? 'Faollashtirildi' : 'Nofaol qilindi',
      )
      setStatusTarget(null)
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Hisob holatini o‘zgartirib bo‘lmadi.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-3 pb-5 sm:px-4 lg:px-5 lg:pb-6">
      <PageHeading
        eyebrow="Foydalanuvchilar"
        title="Hisoblar"
        description="O‘qituvchi va talabalar uchun kirish ma’lumotlarini yarating va ro‘yxatni boshqaring."
        icon={<PeopleAltRoundedIcon />}
        action={<Badge tone="brand" dot className="h-8 px-3 text-xs">{counts?.total ?? usersPage.total} ta hisob</Badge>}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={<PeopleAltRoundedIcon sx={{ fontSize: 18 }} />} label="Jami hisoblar" value={counts?.total ?? usersPage.total} tone="brand" />
        <StatTile icon={<SchoolRoundedIcon sx={{ fontSize: 18 }} />} label="O‘qituvchilar" value={counts?.teachers ?? 0} hint="Dars beruvchilar" tone="info" />
        <StatTile icon={<BadgeOutlinedIcon sx={{ fontSize: 18 }} />} label="Talabalar" value={counts?.students ?? 0} hint="Guruhlarga biriktirilgan" tone="warning" />
        <StatTile icon={<PersonOffOutlinedIcon sx={{ fontSize: 18 }} />} label="Nofaol" value={counts?.inactive ?? 0} hint="Tizimga kira olmaydi" tone="neutral" />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-3 sm:p-4">
          <SectionHeader
            icon={<PeopleAltRoundedIcon sx={{ fontSize: 18 }} />}
            title="Foydalanuvchilar"
            description={`${usersPage.total} ta hisob · sahifada ${PAGE_SIZE} tagacha`}
            action={
              <div className="flex items-center gap-3">
                {isLoading && users.length > 0 && <span className="text-xs font-medium text-brand-600">yangilanmoqda…</span>}
                <Button startIcon={<PersonAddAltRoundedIcon sx={{ fontSize: 18 }} />} onClick={() => setIsCreating(true)}>
                  Yangi hisob
                </Button>
              </div>
            }
          />

          <div className="mt-5 flex flex-col gap-2.5 xl:flex-row xl:flex-wrap xl:items-center">
            <div className="relative min-w-0 flex-1">
              <SearchRoundedIcon sx={{ fontSize: 18 }} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className={`filter-search ${inputBase} h-10 pl-10 pr-10`}
                placeholder="Ism yoki email bo‘yicha qidirish..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                aria-label="Hisoblarni qidirish"
              />
              {searchInput && (
                <button
                  type="button"
                  className="absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Qidiruvni tozalash"
                  onClick={() => setSearchInput('')}
                >
                  <CloseRoundedIcon sx={{ fontSize: 16 }} />
                </button>
              )}
            </div>
            <SegmentedFilter
              ariaLabel="Rol bo‘yicha filtr"
              value={roleFilter}
              onChange={changeRole}
              options={[
                { value: 'all', label: 'Barchasi', count: counts?.total },
                { value: 'teacher', label: 'O‘qituvchilar', count: counts?.teachers },
                { value: 'student', label: 'Talabalar', count: counts?.students },
              ]}
            />
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

        {isLoading && users.length === 0 ? (
          <Table caption="Hisoblar yuklanmoqda" minWidth="min-w-[880px]">
            <AccountsTableHead />
            <TableSkeleton rows={8} columns={COLUMNS} />
          </Table>
        ) : users.length ? (
          <div className={`transition-opacity ${isLoading ? 'opacity-60' : ''}`}>
            <Table caption="Hisoblar ro‘yxati" minWidth="min-w-[880px]">
              <AccountsTableHead />
              <tbody>
                {users.map((account, index) => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    number={(usersPage.page - 1) * usersPage.limit + index + 1}
                    directions={directions}
                    subjects={subjects}
                    onEdit={() => setEditingAccount(account)}
                    onToggleStatus={() => setStatusTarget(account)}
                  />
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={<PeopleAltRoundedIcon />}
            title={hasFilters ? 'Mos hisob topilmadi' : 'Hali hisoblar yo‘q'}
            description={hasFilters ? 'Qidiruv so‘zini o‘zgartiring yoki filtrlarni tozalang.' : '“Yangi hisob” tugmasi orqali birinchi o‘qituvchi yoki talaba hisobini yarating.'}
            action={hasFilters ? (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Filtrlarni tozalash
              </Button>
            ) : (
              <Button size="sm" startIcon={<PersonAddAltRoundedIcon sx={{ fontSize: 16 }} />} onClick={() => setIsCreating(true)}>
                Yangi hisob
              </Button>
            )}
          />
        )}

        {usersPage.totalPages > 1 && (
          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:px-6">
            <Pagination page={page} totalPages={usersPage.totalPages} total={usersPage.total} limit={usersPage.limit} onPageChange={setPage} />
          </div>
        )}
      </Card>

      {isCreating && (
        <CreateAccountDialog
          groups={groups}
          subjects={subjects}
          directions={directions}
          onClose={() => setIsCreating(false)}
          onCreate={createUser}
        />
      )}

      {editingAccount && (
        <EditAccountDialog
          account={editingAccount}
          groups={groups}
          subjects={subjects}
          directions={directions}
          busy={isSaving}
          onClose={() => setEditingAccount(null)}
          onSave={handleUpdateAccount}
        />
      )}

      {statusTarget && (
        <ConfirmDialog
          open
          tone={statusTarget.isActive ? 'danger' : 'brand'}
          title={statusTarget.isActive ? 'Hisobni nofaol qilasizmi?' : 'Hisobni faollashtirasizmi?'}
          description={
            statusTarget.isActive
              ? `${statusTarget.name} hisobi nofaol qilinadi: u tizimga kira olmaydi, lekin darslar, davomat va guruh ma’lumotlari saqlanib qoladi. Keyin uni qayta faollashtirish mumkin.`
              : `${statusTarget.name} hisobi yana faollashadi va o‘z login/paroli bilan tizimga kira oladi.`
          }
          confirmLabel={statusTarget.isActive ? 'Nofaol qilish' : 'Faollashtirish'}
          loading={isUpdatingStatus}
          onConfirm={() => void handleToggleStatus()}
          onClose={() => { if (!isUpdatingStatus) setStatusTarget(null) }}
        />
      )}
    </div>
  )
}

function AccountsTableHead() {
  return (
    <thead>
      <tr>
        <Th className="w-12">#</Th>
        <Th icon={<PersonRoundedIcon />}>Foydalanuvchi</Th>
        <Th icon={<BadgeRoundedIcon />}>Rol</Th>
        <Th icon={<LinkRoundedIcon />}>Biriktirilgan</Th>
        <Th icon={<VerifiedRoundedIcon />}>Holat</Th>
        <Th className="text-right" icon={<TuneRoundedIcon />}>Amallar</Th>
      </tr>
    </thead>
  )
}

function AccountRow({
  account,
  number,
  directions,
  subjects,
  onEdit,
  onToggleStatus,
}: {
  account: User
  number: number
  directions: Direction[]
  subjects: Subject[]
  onEdit: () => void
  onToggleStatus: () => void
}) {
  const isTeacher = account.role === 'teacher'
  const directionNames = (account.directionIds || [])
    .map((id) => directions.find((direction) => direction.id === id)?.name)
    .filter((name): name is string => Boolean(name))
  const subjectNames = (account.subjectIds || [])
    .map((id) => subjects.find((subject) => subject.id === id)?.name)
    .filter((name): name is string => Boolean(name))

  return (
    <Tr className={account.isActive ? '' : 'opacity-75'}>
      <Td className="w-12 text-xs font-semibold tabular-nums text-slate-400">{number}</Td>
      <Td>
        <span className="flex items-center gap-3">
          <span
            className={`grid size-10 shrink-0 place-items-center rounded-xl text-xs font-bold ${
              !account.isActive ? 'bg-slate-100 text-slate-500' : isTeacher ? 'bg-brand-50 text-brand-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            {initials(account.name)}
          </span>
          <span className="min-w-0">
            <strong className="block max-w-[260px] truncate text-sm font-semibold text-slate-800">{account.name}</strong>
            <small className="mt-0.5 block max-w-[260px] truncate text-xs text-slate-400">{account.email}</small>
          </span>
        </span>
      </Td>
      <Td>
        <Badge tone={isTeacher ? 'brand' : 'warning'} className="whitespace-nowrap">
          {isTeacher ? <SchoolRoundedIcon sx={{ fontSize: 13 }} /> : <PeopleAltRoundedIcon sx={{ fontSize: 13 }} />}
          {isTeacher ? 'O‘qituvchi' : 'Talaba'}
        </Badge>
      </Td>
      <Td>
        {isTeacher ? (
          directionNames.length || subjectNames.length ? (
            <span className="block max-w-[340px]">
              <ChipList items={directionNames} emptyText="Yo‘nalish yo‘q" />
              {subjectNames.length > 0 && (
                <small className="mt-1 block truncate text-[11px] text-slate-400" title={subjectNames.join(', ')}>
                  {subjectNames.length} ta fan · {subjectNames.join(', ')}
                </small>
              )}
            </span>
          ) : (
            <span className="text-xs font-medium text-amber-600">Biriktirilmagan</span>
          )
        ) : account.group ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
            <ClassRoundedIcon sx={{ fontSize: 14 }} className="text-slate-400" />
            {account.group.name}
          </span>
        ) : (
          <span className="text-xs font-medium text-amber-600">Guruhsiz</span>
        )}
      </Td>
      <Td>
        <StatusPill active={account.isActive} />
      </Td>
      <Td className="text-right">
        <span className="inline-flex items-center gap-0.5">
          <RowAction label={`${account.name} hisobini tahrirlash`} onClick={onEdit}>
            <EditRoundedIcon sx={{ fontSize: 18 }} />
          </RowAction>
          <RowAction
            label={account.isActive ? `${account.name} hisobini nofaol qilish` : `${account.name} hisobini faollashtirish`}
            tone={account.isActive ? 'danger' : 'success'}
            onClick={onToggleStatus}
          >
            {account.isActive ? <BlockRoundedIcon sx={{ fontSize: 18 }} /> : <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />}
          </RowAction>
        </span>
      </Td>
    </Tr>
  )
}

function ChipList({ items, emptyText, max = 2 }: { items: string[]; emptyText: string; max?: number }) {
  if (!items.length) return <span className="text-xs text-slate-400">{emptyText}</span>
  const visible = items.slice(0, max)
  const rest = items.length - visible.length
  return (
    <span className="flex flex-wrap items-center gap-1" title={items.join(', ')}>
      {visible.map((item) => (
        <span key={item} className="max-w-[150px] truncate rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
          {item}
        </span>
      ))}
      {rest > 0 && (
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-500">+{rest}</span>
      )}
    </span>
  )
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?'
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
  tone: 'brand' | 'info' | 'warning' | 'neutral'
}) {
  return <MetricCard icon={icon} label={label} value={value} hint={hint} tone={({ brand: 'brand', info: 'sky', warning: 'amber', neutral: 'slate' } as const)[tone]} />}
