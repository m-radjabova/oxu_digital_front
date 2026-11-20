import { Navigate, Outlet } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import PageLoader from './PageLoader'
import type { Role } from '../types'

export default function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <PageLoader label="Hisob tekshirilmoqda..." />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role}/dashboard`} replace />
  return <Outlet />
}
