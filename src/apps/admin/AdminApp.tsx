import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import AdminLayout from './components/AdminLayout'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const CabinetsPage = lazy(() => import('./pages/CabinetsPage'))
const BatteriesPage = lazy(() => import('./pages/BatteriesPage'))
const RidersPage = lazy(() => import('./pages/RidersPage'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))
const AlertsPage = lazy(() => import('./pages/AlertsPage'))
const HeatmapPage = lazy(() => import('./pages/HeatmapPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

export default function AdminApp() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center bg-cyber-darker">
          <div className="text-cyber-accent font-rajdhani text-xl animate-pulse">
            加载中...
          </div>
        </div>
      }
    >
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="cabinets" element={<CabinetsPage />} />
          <Route path="batteries" element={<BatteriesPage />} />
          <Route path="riders" element={<RidersPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="heatmap" element={<HeatmapPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
