import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore, useOrderStore } from './store'
import { userApi, orderApi } from './services/api'

import LoginPage from './pages/Login'
import VerifyPage from './pages/Verify'
import DepositPage from './pages/Deposit'
import HomePage from './pages/Home'
import ScanPage from './pages/Scan'
import UnlockPage from './pages/Unlock'
import RidingPage from './pages/Riding'
import PaymentPage from './pages/Payment'
import HelpPage from './pages/Help'
import ProfilePage from './pages/Profile'

const ProtectedRoute = ({ children, requireRide = false }) => {
  const { token, onboardingStatus } = useAuthStore()
  const { activeOrder } = useOrderStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    const checkStatus = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const res = await userApi.getOnboardingStatus()
        setStatus(res.data)

        const orderRes = await orderApi.getActive()
        if (orderRes.data.hasActiveOrder) {
          useOrderStore.getState().setActiveOrder(orderRes.data.order)
        }
      } catch (e) {
        console.error('Status check failed:', e)
      } finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [token])

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (activeOrder && location.pathname !== '/riding') {
    return <Navigate to="/riding" replace />
  }

  if (status && !status.isVerified && location.pathname !== '/verify') {
    return <Navigate to="/verify" replace />
  }

  if (status && status.isVerified && !status.canRide && 
      location.pathname !== '/deposit' && 
      location.pathname !== '/profile' &&
      location.pathname !== '/help') {
    return <Navigate to="/deposit" replace />
  }

  if (requireRide && !activeOrder) {
    return <Navigate to="/" replace />
  }

  return children
}

const LoadingScreen = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#fff'
  }}>
    <div style={{
      width: 48,
      height: 48,
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #FF6B00',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <p style={{ marginTop: 16, color: '#666' }}>加载中...</p>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
)

function App() {
  return (
    <div style={{
      height: '100%',
      maxWidth: 480,
      margin: '0 auto',
      backgroundColor: '#fff',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify" element={
          <ProtectedRoute>
            <VerifyPage />
          </ProtectedRoute>
        } />
        <Route path="/deposit" element={
          <ProtectedRoute>
            <DepositPage />
          </ProtectedRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />
        <Route path="/scan" element={
          <ProtectedRoute>
            <ScanPage />
          </ProtectedRoute>
        } />
        <Route path="/unlock" element={
          <ProtectedRoute>
            <UnlockPage />
          </ProtectedRoute>
        } />
        <Route path="/riding" element={
          <ProtectedRoute requireRide={true}>
            <RidingPage />
          </ProtectedRoute>
        } />
        <Route path="/payment" element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        } />
        <Route path="/help" element={
          <ProtectedRoute>
            <HelpPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  )
}

export default App
