import type { SvgIconComponent } from '@mui/icons-material'
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import type { Role } from '../types'

export interface NavItem {
  path: string
  title: string
  short: string
  icon: SvgIconComponent
  roles: Role[]
  section: 'main' | 'manage' | 'account'
  /** Mobil pastki panelda ko‘rinadimi */
  tab?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { path: 'dashboard', title: 'Dashboard', short: 'Asosiy', icon: SpaceDashboardOutlinedIcon, roles: ['admin', 'teacher', 'student'], section: 'main', tab: true },
  { path: 'schedule', title: 'Dars jadvali', short: 'Jadval', icon: CalendarMonthOutlinedIcon, roles: ['admin', 'teacher', 'student'], section: 'main', tab: true },
  { path: 'workload', title: 'Mening yuklamalarim', short: 'Yuklama', icon: AccessTimeOutlinedIcon, roles: ['teacher'], section: 'main' },
  { path: 'availability', title: 'Band vaqtlarim', short: 'Band vaqt', icon: EventBusyOutlinedIcon, roles: ['teacher'], section: 'main', tab: true },
  { path: 'attendance', title: 'Davomatim', short: 'Davomat', icon: FactCheckOutlinedIcon, roles: ['student'], section: 'main', tab: true },
  { path: 'accounts', title: 'Hisoblar', short: 'Hisoblar', icon: PeopleAltOutlinedIcon, roles: ['admin'], section: 'manage', tab: true },
  { path: 'groups', title: 'Guruhlar', short: 'Guruhlar', icon: GroupsOutlinedIcon, roles: ['admin'], section: 'manage' },
  { path: 'subjects', title: 'Fanlar', short: 'Fanlar', icon: MenuBookOutlinedIcon, roles: ['admin'], section: 'manage' },
  { path: 'structure', title: 'Tuzilma', short: 'Tuzilma', icon: AccountTreeOutlinedIcon, roles: ['admin'], section: 'manage' },
  { path: 'buildings', title: 'Binolar va xonalar', short: 'Binolar', icon: ApartmentOutlinedIcon, roles: ['admin'], section: 'manage' },
  { path: 'profile', title: 'Profil', short: 'Profil', icon: AccountCircleOutlinedIcon, roles: ['admin', 'teacher', 'student'], section: 'account', tab: true },
]

export const NAV_SECTIONS: { key: NavItem['section']; title: string }[] = [
  { key: 'main', title: 'Asosiy' },
  { key: 'manage', title: 'Boshqaruv' },
  { key: 'account', title: 'Hisob' },
]

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  teacher: 'O‘qituvchi',
  student: 'Talaba',
}

export function navItemsFor(role: Role) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}
