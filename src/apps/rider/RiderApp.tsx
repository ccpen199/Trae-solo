import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import RiderLayout from './components/RiderLayout'

const HomePage = lazy(() => import('./pages/HomePage'))
const ScanPage = lazy(() => import('./pages/ScanPage'))
const SwapPage = lazy(() => import('./pages/SwapPage'))
const ReservePage = lazy(() => import('./pages/ReservePage'))
const PaymentPage = lazy(() => import('./pages/PaymentPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const BatteryPage = lazy(() => import('./pages/BatteryPage'))
const PackagePage = lazy(() => import('./pages/PackagePage'))

export default function RiderApp() {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center bg-cyber-darker">
        <div className="text-cyber-accent font-rajdhani text-xl animate-pulse">
          加载中...
        </div>
      </div>
    }>
      <Routes>
        <Route element={<RiderLayout />}>
          <Route index element={<Navigate to="/rider/home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="scan" element={<ScanPage />} />
          <Route path="swap/:cabinetId" element={<SwapPage />} />
          <Route path="reserve" element={<ReservePage />} />
          <Route path="payment/:orderId" element={<PaymentPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="battery" element={<BatteryPage />} />
          <Route path="package" element={<PackagePage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
