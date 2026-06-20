import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import PublicLayout from '@/components/ui/PublicLayout'
import UserLayout from '@/components/layout/UserLayout'
import AdminLayout from '@/components/layout/AdminLayout'

import HomePage from '@/pages/HomePage'
import EvaluatePage from '@/pages/EvaluatePage'
import ProductLibraryPage from '@/pages/ProductLibraryPage'
import ProductDetailPage from '@/pages/ProductDetailPage'
import InspectorProfilePage from '@/pages/InspectorProfilePage'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'

import UserOrdersPage from '@/pages/UserOrdersPage'
import UserOrderDetailPage from '@/pages/UserOrderDetailPage'
import UserReturnsPage from '@/pages/UserReturnsPage'
import ReturnApplyPage from '@/pages/ReturnApplyPage'
import EcoCertificatesPage from '@/pages/EcoCertificatesPage'

import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import CityNetworkPage from '@/pages/admin/CityNetworkPage'
import InventoryDashboardPage from '@/pages/admin/InventoryDashboardPage'
import QualityInspectionPage from '@/pages/admin/QualityInspectionPage'
import EcoMetricsPage from '@/pages/admin/EcoMetricsPage'
import AdminProductsPage from '@/pages/admin/AdminProductsPage'
import AdminInspectorsPage from '@/pages/admin/AdminInspectorsPage'

function AnimatedPage({ Component }: { Component: React.ComponentType }) {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <Component />
      </motion.div>
    </AnimatePresence>
  )
}

function RequireUser({ redirectTo = '/auth/login' }: { redirectTo?: string }) {
  const isAuthed = localStorage.getItem('auth.token')
  if (!isAuthed) return <Navigate to={redirectTo} replace />
  return <Outlet />
}

function RequireAdmin({ redirectTo = '/auth/login' }: { redirectTo?: string }) {
  const role = localStorage.getItem('auth.role')
  if (role !== 'admin') return <Navigate to={redirectTo} replace />
  return <Outlet />
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<AnimatedPage Component={HomePage} />} />
          <Route path="/evaluate" element={<AnimatedPage Component={EvaluatePage} />} />
          <Route path="/products" element={<AnimatedPage Component={ProductLibraryPage} />} />
          <Route path="/products/:id" element={<AnimatedPage Component={ProductDetailPage} />} />
          <Route path="/inspectors/:id" element={<AnimatedPage Component={InspectorProfilePage} />} />
          <Route path="/auth/login" element={<AnimatedPage Component={LoginPage} />} />
        </Route>

        <Route element={<RequireUser />}>
          <Route element={<UserLayout />}>
            <Route path="/user/orders" element={<AnimatedPage Component={UserOrdersPage} />} />
            <Route path="/user/orders/:id" element={<AnimatedPage Component={UserOrderDetailPage} />} />
            <Route path="/user/returns" element={<AnimatedPage Component={UserReturnsPage} />} />
            <Route path="/user/returns/apply/:orderId" element={<AnimatedPage Component={ReturnApplyPage} />} />
            <Route path="/user/certificates" element={<AnimatedPage Component={EcoCertificatesPage} />} />
          </Route>
        </Route>

        <Route element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AnimatedPage Component={AdminDashboardPage} />} />
            <Route path="/admin/cities" element={<AnimatedPage Component={CityNetworkPage} />} />
            <Route path="/admin/inventory" element={<AnimatedPage Component={InventoryDashboardPage} />} />
            <Route path="/admin/quality" element={<AnimatedPage Component={QualityInspectionPage} />} />
            <Route path="/admin/eco" element={<AnimatedPage Component={EcoMetricsPage} />} />
            <Route path="/admin/products" element={<AnimatedPage Component={AdminProductsPage} />} />
            <Route path="/admin/inspectors" element={<AnimatedPage Component={AdminInspectorsPage} />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Router>
  )
}
