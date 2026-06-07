import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import MainLayout from './components/MainLayout'
import Home from './pages/Home'
import Accounts from './pages/Accounts'
import Payment from './pages/Payment'
import PaymentRecords from './pages/PaymentRecords'
import Mall from './pages/Mall'
import Finance from './pages/Finance'
import Services from './pages/Services'
import Profile from './pages/Profile'
import AdminLogin from './pages/admin/Login'
import AdminLayout from './components/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminPayments from './pages/admin/Payments'
import AdminExchanges from './pages/admin/Exchanges'
import AdminProducts from './pages/admin/Products'
import AdminReports from './pages/admin/Reports'

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

const AdminRoute = ({ children }) => {
  const adminToken = localStorage.getItem('admin_token')
  if (!adminToken) {
    return <Navigate to="/admin/login" replace />
  }
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="payment" element={<Payment />} />
        <Route path="payment-records" element={<PaymentRecords />} />
        <Route path="mall" element={<Mall />} />
        <Route path="finance" element={<Finance />} />
        <Route path="services" element={<Services />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="exchanges" element={<AdminExchanges />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>
    </Routes>
  )
}

export default App
