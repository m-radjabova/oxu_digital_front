import type { Role } from '../types'
import AdminScheduleGrid from './AdminScheduleGrid'
import GroupScheduleGrid from './GroupScheduleGrid'
import PersonalScheduleWeek from './PersonalScheduleWeek'
import { useParams } from 'react-router-dom'

export default function ScheduleBoard({ role }: { role: Role }) {
  const { view } = useParams()
  if (role === 'admin') return view === 'teachers' ? <AdminScheduleGrid /> : <GroupScheduleGrid />
  return <PersonalScheduleWeek role={role} />
}
