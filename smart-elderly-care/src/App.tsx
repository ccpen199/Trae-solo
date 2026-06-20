import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
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

type Role = 'government' | 'institution' | 'family'

function LoginPage({ onLogin }: { onLogin: (role: Role) => void }) {
  const navigate = useNavigate()

  const handleLogin = (role: Role) => {
    onLogin(role)
    const entryPaths: Record<Role, string> = {
      government: '/government/dashboard',
      institution: '/institution/overview',
      family: '/family/overview',
    }
    navigate(entryPaths[role])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-800 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">智慧养老综合服务平台</h1>
          <p className="text-slate-400 mt-2">请选择登录角色</p>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => handleLogin('government')}
            className="w-full py-3 px-4 bg-gov-500 text-white rounded-lg font-medium hover:bg-gov-600 transition-colors"
          >
            G端 · 民政监管
          </button>
          <button
            onClick={() => handleLogin('institution')}
            className="w-full py-3 px-4 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
          >
            B端 · 机构管理
          </button>
          <button
            onClick={() => handleLogin('family')}
            className="w-full py-3 px-4 bg-elderly-500 text-white rounded-lg font-medium hover:bg-elderly-400 transition-colors"
          >
            C端 · 家庭端
          </button>
        </div>
      </div>
    </div>
  )
}

function RoleLayout({ role, onRoleChange, children }: { role: Role; onRoleChange: (role: Role) => void; children: React.ReactNode }) {
  return (
    <Layout currentRole={role} onRoleChange={onRoleChange}>
      {children}
    </Layout>
  )
}

function GovernmentRoutes({ onRoleChange }: { onRoleChange: (role: Role) => void }) {
  return (
    <RoleLayout role="government" onRoleChange={onRoleChange}>
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
  )
}

function InstitutionRoutes({ onRoleChange }: { onRoleChange: (role: Role) => void }) {
  return (
    <RoleLayout role="institution" onRoleChange={onRoleChange}>
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
  )
}

function FamilyRoutes({ onRoleChange }: { onRoleChange: (role: Role) => void }) {
  return (
    <RoleLayout role="family" onRoleChange={onRoleChange}>
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
  )
}

export default function App() {
  const [currentRole, setCurrentRole] = useState<Role>('government')
  const location = useLocation()

  const handleRoleChange = (role: Role) => {
    setCurrentRole(role)
  }

  const isLoggedIn = location.pathname !== '/'

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/" element={<LoginPage onLogin={handleRoleChange} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/government/*" element={<GovernmentRoutes onRoleChange={handleRoleChange} />} />
      <Route path="/institution/*" element={<InstitutionRoutes onRoleChange={handleRoleChange} />} />
      <Route path="/family/*" element={<FamilyRoutes onRoleChange={handleRoleChange} />} />
      <Route path="*" element={<Navigate to={`/${currentRole}`} replace />} />
    </Routes>
  )
}
