import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import WaybillList from '@/pages/WaybillList'
import WaybillDetail from '@/pages/WaybillDetail'
import KnightList from '@/pages/KnightList'
import KnightDetail from '@/pages/KnightDetail'
import DispatchCenter from '@/pages/DispatchCenter'
import TrackingPage from '@/pages/TrackingPage'
import HeatmapPage from '@/pages/HeatmapPage'
import CreditSystem from '@/pages/CreditSystem'
import ExceptionList from '@/pages/ExceptionList'
import SettlementList from '@/pages/SettlementList'
import { useAuthStore } from '@/store'
import { authAPI } from '@/api'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated())
  const [loading, setLoading] = useState(true)
  const [valid, setValid] = useState(false)

  useEffect(() => {
    let cancelled = false
    const timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        useAuthStore.getState().logout()
        setValid(false)
        setLoading(false)
      }
    }, 6000)

    const verify = async () => {
      if (!isAuthenticated) {
        window.clearTimeout(timeoutId)
        setLoading(false)
        return
      }
      try {
        await authAPI.getMe()
        if (!cancelled) {
          setValid(true)
        }
      } catch {
        useAuthStore.getState().logout()
      } finally {
        window.clearTimeout(timeoutId)
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    verify()

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [isAuthenticated])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#595959' }}>
        <Spin size="large" />
        <div>正在校验登录状态，请稍候...</div>
      </div>
    )
  }

  if (!isAuthenticated || !valid) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/waybills" element={<WaybillList />} />
                  <Route path="/waybills/:id" element={<WaybillDetail />} />
                  <Route path="/knights" element={<KnightList />} />
                  <Route path="/knights/:id" element={<KnightDetail />} />
                  <Route path="/dispatch" element={<DispatchCenter />} />
                  <Route path="/tracking" element={<TrackingPage />} />
                  <Route path="/heatmap" element={<HeatmapPage />} />
                  <Route path="/credit" element={<CreditSystem />} />
                  <Route path="/exceptions" element={<ExceptionList />} />
                  <Route path="/settlements" element={<SettlementList />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
