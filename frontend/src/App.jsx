import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import LoginPage from './pages/Login'
import Dashboard from './pages/Dashboard'
import ServiceList from './pages/Services/ServiceList'
import ServiceDetail from './pages/Services/ServiceDetail'
import AuthCenter from './pages/Auth/AuthCenter'
import PaymentCenter from './pages/Payment/PaymentCenter'
import CollaborationCenter from './pages/Collaboration/CollaborationCenter'
import InteractiveCenter from './pages/Interactive/InteractiveCenter'
import MonitoringCenter from './pages/Monitoring/MonitoringCenter'

function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      const demoUser = {
        id: 1,
        username: 'admin',
        real_name: '系统管理员',
        role: 'admin',
        auth_source: 'local',
        level: 'province'
      }
      localStorage.setItem('user', JSON.stringify(demoUser))
      return demoUser
    }
    const user = JSON.parse(userStr)
    return user && user.id ? user : null
  } catch {
    return null
  }
}

function AuthGuard({ children }) {
  const user = getCurrentUser()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <AuthGuard>
            <MainLayout />
          </AuthGuard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="services" element={<ServiceList />} />
        <Route path="services/:id" element={<ServiceDetail />} />
        <Route path="auth-center" element={<AuthCenter />} />
        <Route path="payment" element={<PaymentCenter />} />
        <Route path="collaboration" element={<CollaborationCenter />} />
        <Route path="interactive" element={<InteractiveCenter />} />
        <Route path="monitoring" element={<MonitoringCenter />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
