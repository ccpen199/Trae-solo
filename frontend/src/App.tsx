import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Login from './pages/Login'
import MainLayout from './components/MainLayout'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Exceptions from './pages/Exceptions'
import Dispatches from './pages/Dispatches'
import Vehicles from './pages/Vehicles'
import ScanUnlock from './pages/ScanUnlock'

function App() {
  const { token } = useAuthStore()

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!token) {
      return <Navigate to="/login" replace />
    }
    return <>{children}</>
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="scan" element={<ScanUnlock />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:orderId" element={<OrderDetail />} />
          <Route path="exceptions" element={<Exceptions />} />
          <Route path="dispatches" element={<Dispatches />} />
          <Route path="vehicles" element={<Vehicles />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
