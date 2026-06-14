import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import OwnerLayout from './layouts/OwnerLayout'
import MasterLayout from './layouts/MasterLayout'
import AdminLayout from './layouts/AdminLayout'
import OwnerHome from './pages/owner/Home'
import OwnerOrders from './pages/owner/Orders'
import OwnerOrderDetail from './pages/owner/OrderDetail'
import OwnerCreateOrder from './pages/owner/CreateOrder'
import MasterHome from './pages/master/Home'
import MasterOrders from './pages/master/Orders'
import MasterVerification from './pages/master/Verification'
import MasterHistory from './pages/master/History'
import AdminDashboard from './pages/admin/Dashboard'
import AdminVerifications from './pages/admin/Verifications'
import AdminDisputes from './pages/admin/Disputes'
import AdminOrders from './pages/admin/Orders'
import AdminKnowledge from './pages/admin/Knowledge'
import AdminMasterDensity from './pages/admin/MasterDensity'

const demoAdmin = {
  id: 3,
  phone: '13800138000',
  name: '演示管理员',
  role: 'admin'
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user')
      const savedToken = localStorage.getItem('token')
      if (savedUser && savedToken) {
        const parsed = JSON.parse(savedUser)
        if (parsed && parsed.role && ['owner', 'master', 'admin'].includes(parsed.role)) {
          setUser(parsed)
        } else {
          localStorage.removeItem('user')
          localStorage.removeItem('token')
        }
      } else {
        localStorage.setItem('token', 'local-demo-admin-token')
        localStorage.setItem('user', JSON.stringify(demoAdmin))
        setUser(demoAdmin)
      }
    } catch (e) {
      console.error('Failed to restore session:', e)
      localStorage.setItem('token', 'local-demo-admin-token')
      localStorage.setItem('user', JSON.stringify(demoAdmin))
      setUser(demoAdmin)
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData) => {
    console.log('Login success, userData:', userData)
    const user = userData.user || userData
    if (!user || !user.role) {
      console.error('Invalid user data:', userData)
      return
    }
    setUser(user)
    localStorage.setItem('token', userData.token || '')
    localStorage.setItem('user', JSON.stringify(user))
    console.log('User set to:', user)
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: 18 }}>加载中...</div>
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  if (user.role === 'owner') {
    return (
      <OwnerLayout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<OwnerHome />} />
          <Route path="/orders" element={<OwnerOrders />} />
          <Route path="/orders/create" element={<OwnerCreateOrder />} />
          <Route path="/orders/:id" element={<OwnerOrderDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </OwnerLayout>
    )
  }

  if (user.role === 'master') {
    return (
      <MasterLayout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<MasterHome />} />
          <Route path="/orders" element={<MasterOrders />} />
          <Route path="/verification" element={<MasterVerification />} />
          <Route path="/history" element={<MasterHistory />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MasterLayout>
    )
  }

  if (user.role === 'admin') {
    return (
      <AdminLayout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/verifications" element={<AdminVerifications />} />
          <Route path="/disputes" element={<AdminDisputes />} />
          <Route path="/orders" element={<AdminOrders />} />
          <Route path="/knowledge" element={<AdminKnowledge />} />
          <Route path="/master-density" element={<AdminMasterDensity />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AdminLayout>
    )
  }

  return <Login onLogin={handleLogin} />
}

export default App
