import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import Dashboard from '@/pages/Dashboard'
import CargoList from '@/pages/CargoList'
import CargoPublish from '@/pages/CargoPublish'
import ERPConfig from '@/pages/ERPConfig'
import CapacityList from '@/pages/CapacityList'
import ReturnSource from '@/pages/ReturnSource'
import TrackingOverview from '@/pages/TrackingOverview'
import AlertCenter from '@/pages/AlertCenter'
import InsuranceHome from '@/pages/InsuranceHome'
import InsuranceApply from '@/pages/InsuranceApply'
import InsurancePolicies from '@/pages/InsurancePolicies'
import ClaimsCenter from '@/pages/ClaimsCenter'
import ServiceCenter from '@/pages/ServiceCenter'
import EtcService from '@/pages/EtcService'
import FuelService from '@/pages/FuelService'
import MaintenanceService from '@/pages/MaintenanceService'
import CargoDetail from '@/pages/CargoDetail'
import NotFound from '@/pages/NotFound'
import ErrorBoundary from '@/components/common/ErrorBoundary'

function RedirectToDashboard() {
  const navigate = useNavigate()
  
  useEffect(() => {
    navigate('/dashboard', { replace: true })
  }, [navigate])
  
  return null
}

export default function App() {
  return (
    <Router>
      <ErrorBoundary>
        {/* 调试指示器 - 用于确认 React 已渲染 */}
        <div 
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            background: '#16C79A',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            zIndex: 999999,
            opacity: 0.8,
            pointerEvents: 'none',
          }}
        >
          ✓ React Ready
        </div>
        
        {/* 备用渲染：直接渲染 Dashboard 以验证组件可用性 */}
        <div style={{ display: 'none' }} id="dashboard-fallback-test">
          <Dashboard />
        </div>
        
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<RedirectToDashboard />} />
            <Route path="dashboard" element={<Dashboard />} />

            <Route path="cargo">
              <Route index element={<CargoList />} />
              <Route path="publish" element={<CargoPublish />} />
              <Route path="erp-config" element={<ERPConfig />} />
              <Route path=":id" element={<CargoDetail />} />
            </Route>

            <Route path="capacity">
              <Route index element={<CapacityList />} />
              <Route path="return" element={<ReturnSource />} />
              <Route path=":id" element={<CapacityList />} />
            </Route>

            <Route path="tracking">
              <Route index element={<TrackingOverview />} />
              <Route path="alerts" element={<AlertCenter />} />
              <Route path=":waybillId" element={<TrackingOverview />} />
            </Route>

            <Route path="insurance">
              <Route index element={<InsuranceHome />} />
              <Route path="apply" element={<InsuranceApply />} />
              <Route path="policies" element={<InsurancePolicies />} />
              <Route path="claims" element={<ClaimsCenter />} />
            </Route>

            <Route path="service">
              <Route index element={<ServiceCenter />} />
              <Route path="etc" element={<EtcService />} />
              <Route path="fuel" element={<FuelService />} />
              <Route path="maintenance" element={<MaintenanceService />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </Router>
  )
}
