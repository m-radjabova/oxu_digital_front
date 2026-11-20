import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import AuthProvider from './components/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import HomeRedirect from './components/HomeRedirect'
import PageLoader from './components/PageLoader'
import useToast from './hooks/useToast'
import { API_ERROR_EVENT, type ApiErrorNotification } from './lib/api'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const StatusPage = lazy(() => import('./pages/StatusPage'))
const AdminOverviewPage = lazy(() => import('./pages/admin/OverviewPage'))
const AdminDashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const AccountsPage = lazy(() => import('./pages/admin/AccountsPage'))
const GroupsPage = lazy(() => import('./pages/admin/GroupsPage'))
const SubjectsPage = lazy(() => import('./pages/admin/SubjectsPage'))
const AcademicLoadPage = lazy(() => import('./pages/admin/AcademicLoadPage'))
const StructurePage = lazy(() => import('./pages/admin/StructurePage'))
const BuildingsPage = lazy(() => import('./pages/admin/BuildingsPage'))
const TeacherWorkloadPage = lazy(() => import('./pages/teacher/WorkloadPage'))
const TeacherOverviewPage = lazy(() => import('./pages/teacher/OverviewPage'))
const TeacherDashboardPage = lazy(() => import('./pages/teacher/DashboardPage'))
const StudentOverviewPage = lazy(() => import('./pages/student/OverviewPage'))
const StudentDashboardPage = lazy(() => import('./pages/student/DashboardPage'))
const StudentAttendancePage = lazy(() => import('./pages/student/AttendancePage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const AttendancePage = lazy(() => import('./pages/teacher/AttendancePage'))
const AvailabilityPage = lazy(() => import('./pages/teacher/AvailabilityPage'))

function ApiErrorHandler() {
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    const handleApiError = (event: Event) => {
      const { message, route } = (event as CustomEvent<ApiErrorNotification>).detail
      const title = route === '/401'
        ? 'Qayta kirish kerak'
        : route === '/403'
          ? 'Bu sahifa yopiq'
          : route === '/500'
            ? 'Hozircha bajarib bo‘lmadi'
            : 'Ma’lumotni tekshiring'
      toast.error(message, title)
      if (route) navigate(route, { replace: true })
    }

    window.addEventListener(API_ERROR_EVENT, handleApiError)
    return () => window.removeEventListener(API_ERROR_EVENT, handleApiError)
  }, [navigate, toast])

  return null
}

export default function App() {
  return (
    <AuthProvider>
      <ApiErrorHandler />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/401" element={<StatusPage status={401} />} />
          <Route path="/403" element={<StatusPage status={403} />} />
          <Route path="/500" element={<StatusPage status={500} />} />
          <Route path="/" element={<HomeRedirect />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<ProtectedRoute roles={['admin']} />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminOverviewPage />} />
                <Route path="schedule" element={<Navigate to="groups" replace />} />
                <Route path="schedule/:view" element={<AdminDashboardPage />} />
                <Route path="accounts" element={<AccountsPage />} />
                <Route path="groups" element={<GroupsPage />} />
                <Route path="subjects" element={<SubjectsPage />} />
                <Route path="academic-load" element={<AcademicLoadPage />} />
                <Route path="structure" element={<StructurePage />} />
                <Route path="buildings" element={<BuildingsPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
            </Route>
            <Route path="/teacher" element={<ProtectedRoute roles={['teacher']} />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<TeacherOverviewPage />} />
                <Route path="schedule" element={<TeacherDashboardPage />} />
                <Route path="availability" element={<AvailabilityPage />} />
                <Route path="workload" element={<TeacherWorkloadPage />} />
                <Route path="attendance/:lessonId" element={<AttendancePage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
            </Route>
            <Route path="/student" element={<ProtectedRoute roles={['student']} />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<StudentOverviewPage />} />
                <Route path="schedule" element={<StudentDashboardPage />} />
                <Route path="attendance" element={<StudentAttendancePage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}
