import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Layout from './components/Layout'

import Login from './pages/Login'
import Register from './pages/Register'
import Forbidden from './pages/Forbidden'

import Dashboard from './pages/Dashboard'
import SocialSecurity from './pages/SocialSecurity'
import AIInterview from './pages/AIInterview'
import ResumeOptimize from './pages/ResumeOptimize'
import Compliance from './pages/Compliance'
import ContractScan from './pages/ContractScan'
import Mall from './pages/Mall'
import MallProductDetail from './pages/MallProductDetail'

import EnterpriseDashboard from './pages/enterprise/Dashboard'
import EnterpriseEmployees from './pages/enterprise/Employees'
import EnterpriseCompliance from './pages/enterprise/Compliance'
import EnterpriseAlerts from './pages/enterprise/Alerts'
import EnterpriseHeatmap from './pages/enterprise/Heatmap'

import AdminDashboard from './pages/admin/Dashboard'
import AdminAudit from './pages/admin/Audit'
import AdminUsers from './pages/admin/Users'
import AudienceRules from './pages/admin/AudienceRules'
import RedemptionManagement from './pages/admin/RedemptionManagement'
import ExpiryManagement from './pages/admin/ExpiryManagement'
import AuditReview from './pages/admin/AuditReview'

const roleHomeMap = {
  user: '/',
  enterprise: '/enterprise',
  admin: '/admin',
}

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/forbidden" replace />
  }

  return children
}

const RoleBasedHomeRedirect = () => {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role === 'user') {
    return (
      <ProtectedRoute>
        <Layout>
          <Dashboard />
        </Layout>
      </ProtectedRoute>
    )
  }

  const targetPath = roleHomeMap[user?.role] || '/'
  return <Navigate to={targetPath} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forbidden" element={<Forbidden />} />

      <Route path="/" element={<RoleBasedHomeRedirect />} />

      <Route
        path="/social-security"
        element={
          <ProtectedRoute roles={['user', 'admin']}>
            <Layout>
              <SocialSecurity />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-interview"
        element={
          <ProtectedRoute roles={['user', 'admin']}>
            <Layout>
              <AIInterview />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume-optimize"
        element={
          <ProtectedRoute roles={['user', 'admin']}>
            <Layout>
              <ResumeOptimize />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/compliance"
        element={
          <ProtectedRoute roles={['user', 'enterprise', 'admin']}>
            <Layout>
              <Compliance />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contract-scan"
        element={
          <ProtectedRoute roles={['user', 'enterprise', 'admin']}>
            <Layout>
              <ContractScan />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/mall"
        element={
          <ProtectedRoute>
            <Layout>
              <Mall />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/mall/product/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <MallProductDetail />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/enterprise"
        element={
          <ProtectedRoute roles={['enterprise', 'admin']}>
            <Layout>
              <EnterpriseDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/enterprise/employees"
        element={
          <ProtectedRoute roles={['enterprise', 'admin']}>
            <Layout>
              <EnterpriseEmployees />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/enterprise/compliance"
        element={
          <ProtectedRoute roles={['enterprise', 'admin']}>
            <Layout>
              <EnterpriseCompliance />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/enterprise/alerts"
        element={
          <ProtectedRoute roles={['enterprise', 'admin']}>
            <Layout>
              <EnterpriseAlerts />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/enterprise/heatmap"
        element={
          <ProtectedRoute roles={['enterprise', 'admin']}>
            <Layout>
              <EnterpriseHeatmap />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit"
        element={
          <ProtectedRoute roles={['admin']}>
            <Layout>
              <AdminAudit />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={['admin']}>
            <Layout>
              <AdminUsers />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audience-rules"
        element={
          <ProtectedRoute roles={['admin']}>
            <Layout>
              <AudienceRules />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/redemption"
        element={
          <ProtectedRoute roles={['admin']}>
            <Layout>
              <RedemptionManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/expiry"
        element={
          <ProtectedRoute roles={['admin']}>
            <Layout>
              <ExpiryManagement />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit-review"
        element={
          <ProtectedRoute roles={['admin']}>
            <Layout>
              <AuditReview />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
