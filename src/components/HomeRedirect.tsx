import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import PageLoader from './PageLoader'

export default function HomeRedirect() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <PageLoader label="Hisob tekshirilmoqda..." />
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={`/${user.role}/dashboard`} replace />
}
