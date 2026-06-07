import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import useUserStore from './store/userStore'
import MainLayout from './components/MainLayout'
import AdminLayout from './components/AdminLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import MeterReading from './pages/MeterReading'
import Billing from './pages/Billing'
import AutoPay from './pages/AutoPay'
import WorkOrder from './pages/WorkOrder'
import WorkOrderCreate from './pages/WorkOrderCreate'

import Mall from './pages/Mall'
import ProductDetail from './pages/ProductDetail'
import MallOrder from './pages/MallOrder'
import Warranty from './pages/Warranty'
import SafetyKnowledge from './pages/SafetyKnowledge'
import UsageStatistics from './pages/UsageStatistics'
import Profile from './pages/Profile'
import AdminDashboard from './pages/admin/Dashboard'
import AdminWorkOrders from './pages/admin/WorkOrders'
import AdminUsers from './pages/admin/Users'
import AdminSlaMonitor from './pages/admin/SlaMonitor'
import AdminMeterReadings from './pages/admin/MeterReadings'

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token, fetchMe, meter } = useUserStore()

  useEffect(() => {
    if (token && location.pathname !== '/login' && location.pathname !== '/register') {
      fetchMe().catch((err) => {
        console.error('fetchMe failed:', err)
      })
    }
  }, [token, location.pathname])

  const isPublicRoute = ['/login', '/register'].includes(location.pathname)

  if (!token && !isPublicRoute) {
    return <Navigate to="/login" replace />
  }

  if (token && isPublicRoute) {
    return <Navigate to="/" replace />
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="work-orders" element={<AdminWorkOrders />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="sla-monitor" element={<AdminSlaMonitor />} />
        <Route path="meter-readings" element={<AdminMeterReadings />} />
      </Route>

      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="meter-reading" element={<MeterReading />} />
        <Route path="billing" element={<Billing />} />
        <Route path="auto-pay" element={<AutoPay />} />
        <Route path="work-order" element={<WorkOrder />} />
        <Route path="work-order/create" element={<WorkOrderCreate />} />
        <Route path="mall" element={<Mall />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route path="mall-orders" element={<MallOrder />} />
        <Route path="warranty" element={<Warranty />} />
        <Route path="safety" element={<SafetyKnowledge />} />
        <Route path="usage-stats" element={<UsageStatistics />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
