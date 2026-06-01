import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import MainLayout from './layout/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import WorkloadList from './pages/WorkloadList'
import WorkloadDetail from './pages/WorkloadDetail'
import Publish from './pages/Publish'
import Operations from './pages/Operations'
import Inspection from './pages/Inspection'
import { useAppStore } from './store'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAppStore((s) => s.token)
  const location = useLocation()
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}

function AutoRedirect() {
  const navigate = useNavigate()
  const token = useAppStore((s) => s.token)
  useEffect(() => {
    navigate(token ? '/dashboard' : '/login', { replace: true })
  }, [token, navigate])
  return null
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AutoRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clusters" element={<Dashboard />} />
        <Route path="/workloads" element={<WorkloadList />} />
        <Route path="/workloads/:id" element={<WorkloadDetail />} />
        <Route path="/publish" element={<Publish />} />
        <Route path="/operations" element={<Operations />} />
        <Route path="/inspection" element={<Inspection />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
