import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import Layout from '@/components/Layout'
import { useAuthStore } from '@/stores/authStore'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import AccessControl from '@/pages/access/AccessControl'
import AccessRecords from '@/pages/access/AccessRecords'
import VisitorCode from '@/pages/access/VisitorCode'
import DeviceList from '@/pages/devices/DeviceList'
import HeartbeatMonitor from '@/pages/devices/HeartbeatMonitor'
import OTAUpgrade from '@/pages/devices/OTAUpgrade'
import OfflineCache from '@/pages/devices/OfflineCache'
import RepairList from '@/pages/repairs/RepairList'
import RepairCreate from '@/pages/repairs/RepairCreate'
import RepairDetail from '@/pages/repairs/RepairDetail'
import CommunityFeed from '@/pages/community/CommunityFeed'
import CommunityReview from '@/pages/community/CommunityReview'
import PaymentList from '@/pages/payments/PaymentList'
import PaymentReceipt from '@/pages/payments/PaymentReceipt'
import AnnouncementList from '@/pages/announcements/AnnouncementList'
import AnnouncementCreate from '@/pages/announcements/AnnouncementCreate'
import OrganizationTree from '@/pages/organization/OrganizationTree'
import PermissionMatrix from '@/pages/permissions/PermissionMatrix'
import AlertList from '@/pages/alerts/AlertList'
import AlertDetail from '@/pages/alerts/AlertDetail'
import Reports from '@/pages/reports/Reports'

function AuthInitializer() {
  const initialized = useAuthStore((s) => s.initialized)
  const initialize = useAuthStore((s) => s.initialize)
  const ranRef = useRef(false)

  useEffect(() => {
    if (!ranRef.current) {
      ranRef.current = true
      initialize()
    }
  }, [initialize])

  return initialized
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isReady = AuthInitializer()
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-5" />
          <p className="text-sm text-slate-300 font-medium">正在进入工作台...</p>
          <p className="text-xs text-slate-500 mt-2">正在校验身份令牌与权限范围</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    const redirect = location.pathname + location.search
    return <Navigate to="/login" replace state={{ from: redirect }} />
  }
  return <>{children}</>
}

function LoginPageWrapper() {
  const isReady = AuthInitializer()
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation() as any
  const navigate = useNavigate()
  const ranRef = useRef(false)

  useEffect(() => {
    if (!isReady || !isAuthenticated || ranRef.current) return
    ranRef.current = true
    const to = location.state?.from || '/'
    setTimeout(() => navigate(to, { replace: true }), 0)
  }, [isReady, isAuthenticated, location.state, navigate])

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (isAuthenticated) {
    const to = location.state?.from || '/'
    return <Navigate to={to} replace state={{ user }} />
  }
  return <Login />
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPageWrapper />} />
        <Route
          path="/"
          element={
            <AuthGuard>
              <Layout />
            </AuthGuard>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="access" element={<AccessControl />} />
          <Route path="access/records" element={<AccessRecords />} />
          <Route path="access/visitor-code" element={<VisitorCode />} />
          <Route path="devices" element={<DeviceList />} />
          <Route path="devices/heartbeat" element={<HeartbeatMonitor />} />
          <Route path="devices/ota" element={<OTAUpgrade />} />
          <Route path="devices/offline-cache" element={<OfflineCache />} />
          <Route path="repairs" element={<RepairList />} />
          <Route path="repairs/create" element={<RepairCreate />} />
          <Route path="repairs/:id" element={<RepairDetail />} />
          <Route path="community" element={<CommunityFeed />} />
          <Route path="community/review" element={<CommunityReview />} />
          <Route path="payments" element={<PaymentList />} />
          <Route path="payments/:id/receipt" element={<PaymentReceipt />} />
          <Route path="announcements" element={<AnnouncementList />} />
          <Route path="announcements/create" element={<AnnouncementCreate />} />
          <Route path="organization" element={<OrganizationTree />} />
          <Route path="permissions" element={<PermissionMatrix />} />
          <Route path="alerts" element={<AlertList />} />
          <Route path="alerts/:id" element={<AlertDetail />} />
          <Route path="reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
