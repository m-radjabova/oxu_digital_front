import type { ReactNode } from 'react'
import MetricCard from '../ui/MetricCard'
import type { DashboardTone } from './styles'

export default function StatCard(props: {
  icon: ReactNode
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: DashboardTone
  to?: string
  loading?: boolean
  delay?: number
}) {
  return <MetricCard {...props} />
}
