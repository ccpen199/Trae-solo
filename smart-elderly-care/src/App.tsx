import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/Login'
import FamilyOverview from './pages/family/Overview'
import MedicationTracker from './pages/family/MedicationTracker'
import BehaviorAlert from './pages/family/BehaviorAlert'
import EmergencyContacts from './pages/family/EmergencyContacts'
import Dashboard from './pages/government/Dashboard'
import AuditTrail from './pages/government/AuditTrail'
import SubsidyTracking from './pages/government/SubsidyTracking'
import ComplaintManagement from './pages/government/ComplaintManagement'
import Overview from './pages/institution/Overview'
import NursingPlanPage from './pages/institution/NursingPlan'
import BedManagement from './pages/institution/BedManagement'
import ElectronicSignature from './pages/institution/ElectronicSignature'
import ElderProfile from './pages/shared/ElderProfile'
import ServiceOrder from './pages/shared/ServiceOrder'
import SmartScheduling from './pages/shared/SmartScheduling'
import { AuthProvider, useAuth } from './context/AuthContext'
import type { Role } from './types'

function RoleLayout({ role, children }: { role: Role; children: React.ReactNode }) {
  const handleRoleChange = (_newRole: Role) => {
    // 角色切换由 Layout 内部处理
  }
  return (
    <Layout currentRole={role} onRoleChange={handleRoleChange}>
      {children}
    </Layout>
  )
}

function GovernmentRoutes() {
  return (
    <ProtectedRoute allowedRoles={['government']}>
      <RoleLayout role="government">
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="audit" element={<AuditTrail />} />
          <Route path="subsidy" element={<SubsidyTracking />} />
          <Route path="complaints" element={<ComplaintManagement />} />
          <Route path="elders" element={<ElderProfile />} />
          <Route path="orders" element={<ServiceOrder />} />
          <Route path="dispatch" element={<SmartScheduling />} />
        </Routes>
      </RoleLayout>
    </ProtectedRoute>
  )
}

function InstitutionRoutes() {
  return (
    <ProtectedRoute allowedRoles={['institution']}>
      <RoleLayout role="institution">
        <Routes>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="care-plan" element={<NursingPlanPage />} />
          <Route path="beds" element={<BedManagement />} />
          <Route path="e-sign" element={<ElectronicSignature />} />
          <Route path="elders" element={<ElderProfile />} />
          <Route path="orders" element={<ServiceOrder />} />
          <Route path="dispatch" element={<SmartScheduling />} />
        </Routes>
      </RoleLayout>
    </ProtectedRoute>
  )
}

function FamilyRoutes() {
  return (
    <ProtectedRoute allowedRoles={['family']}>
      <RoleLayout role="family">
        <Routes>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<FamilyOverview />} />
          <Route path="medication" element={<MedicationTracker />} />
          <Route path="alerts" element={<BehaviorAlert />} />
          <Route path="emergency" element={<EmergencyContacts />} />
          <Route path="elders" element={<ElderProfile />} />
          <Route path="orders" element={<ServiceOrder />} />
          <Route path="dispatch" element={<SmartScheduling />} />
        </Routes>
      </RoleLayout>
    </ProtectedRoute>
  )
}

function AppContent() {
  const { isAuthenticated, currentUser } = useAuth()

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  const userRole = currentUser?.role as Role
  const entryPath = {
    government: '/government/dashboard',
    institution: '/institution/overview',
    family: '/family/overview',
  }[userRole]

  return (
    <Routes>
      <Route path="/" element={<Navigate to={entryPath} replace />} />
      <Route path="/government/*" element={<GovernmentRoutes />} />
      <Route path="/institution/*" element={<InstitutionRoutes />} />
      <Route path="/family/*" element={<FamilyRoutes />} />
      <Route path="*" element={<Navigate to={entryPath} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
