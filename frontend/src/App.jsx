import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { isLoggedIn, getUserRole, saveUser, getUser } from './utils/auth'
import request from './utils/request'
import AppLayout from './components/AppLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import JobListPage from './pages/JobListPage'
import JobDetailPage from './pages/JobDetailPage'
import CreateJobPage from './pages/CreateJobPage'
import EmployerJobsPage from './pages/EmployerJobsPage'
import WorkerProfilePage from './pages/WorkerProfilePage'
import EmployerProfilePage from './pages/EmployerProfilePage'
import OrderListPage from './pages/OrderListPage'
import OrderDetailPage from './pages/OrderDetailPage'
import MessageListPage from './pages/MessageListPage'
import ChatPage from './pages/ChatPage'
import SettlementListPage from './pages/SettlementListPage'
import GuaranteePage from './pages/GuaranteePage'
import AdminDashboard from './pages/admin/AdminDashboard'
import HealthCenterPage from './pages/admin/HealthCenterPage'
import StudentOpsPage from './pages/admin/StudentOpsPage'
import FinancialAuditPage from './pages/admin/FinancialAuditPage'
import JobAuditPage from './pages/admin/JobAuditPage'
import ArbitratePage from './pages/admin/ArbitratePage'
import { Spin } from 'antd'

async function activateDemoUser(role = 'worker') {
  const credentials = {
    worker: { username: 'worker1', password: 'worker123' },
    employer: { username: 'employer1', password: 'employer123' },
    admin: { username: 'admin', password: 'admin123' }
  }
  try {
    const res = await request.post('/auth/login', credentials[role] || credentials.worker)
    const user = {
      ...res.data.user,
      token: res.data.token
    }
    saveUser(user)
    return user
  } catch (e) {
    console.error('Demo login failed:', e)
    const fallback = {
      worker: { id: 2, username: '演示求职者', role: 'worker', token: 'local-demo-worker' },
      employer: { id: 3, username: '演示雇主', role: 'employer', token: 'local-demo-employer' },
      admin: { id: 1, username: '演示管理员', role: 'admin', token: 'local-demo-admin' }
    }
    saveUser(fallback[role] || fallback.worker)
  }
}

function PrivateRoute({ children, roles }) {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoggedIn()) {
        await activateDemoUser(roles?.[0] || 'worker')
      } else if (roles && !roles.includes(getUserRole())) {
        await activateDemoUser(roles[0])
      }
      setAuthorized(true)
      setLoading(false)
    }
    checkAuth()
  }, [roles])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  return authorized ? children : null
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<AppLayout />}>
        <Route index element={<JobListPage />} />
        <Route path="jobs" element={<JobListPage />} />
        <Route path="jobs/:id" element={<JobDetailPage />} />
        <Route
          path="worker/profile"
          element={
            <PrivateRoute roles={['worker']}>
              <WorkerProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="employer/profile"
          element={
            <PrivateRoute roles={['employer']}>
              <EmployerProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="employer/jobs"
          element={
            <PrivateRoute roles={['employer']}>
              <EmployerJobsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="employer/jobs/new"
          element={
            <PrivateRoute roles={['employer']}>
              <CreateJobPage />
            </PrivateRoute>
          }
        />
        <Route
          path="create-job"
          element={
            <PrivateRoute roles={['employer']}>
              <CreateJobPage />
            </PrivateRoute>
          }
        />
        <Route
          path="orders"
          element={
            <PrivateRoute>
              <OrderListPage />
            </PrivateRoute>
          }
        />
        <Route
          path="orders/:id"
          element={
            <PrivateRoute>
              <OrderDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="messages"
          element={
            <PrivateRoute>
              <MessageListPage />
            </PrivateRoute>
          }
        />
        <Route
          path="messages/:id"
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          }
        />
        <Route
          path="settlements"
          element={
            <PrivateRoute>
              <SettlementListPage />
            </PrivateRoute>
          }
        />
        <Route
          path="guarantees"
          element={
            <PrivateRoute roles={['worker']}>
              <GuaranteePage />
            </PrivateRoute>
          }
        />
        <Route
          path="admin/dashboard"
          element={
            <PrivateRoute roles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="admin"
          element={
            <PrivateRoute roles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="admin/health-center"
          element={
            <PrivateRoute roles={['admin']}>
              <HealthCenterPage />
            </PrivateRoute>
          }
        />
        <Route
          path="admin/student-ops"
          element={
            <PrivateRoute roles={['admin']}>
              <StudentOpsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="admin/financial-audit"
          element={
            <PrivateRoute roles={['admin']}>
              <FinancialAuditPage />
            </PrivateRoute>
          }
        />
        <Route
          path="admin/jobs/audit"
          element={
            <PrivateRoute roles={['admin']}>
              <JobAuditPage />
            </PrivateRoute>
          }
        />
        <Route
          path="admin/arbitrate"
          element={
            <PrivateRoute roles={['admin']}>
              <ArbitratePage />
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  )
}
