import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Devices from './pages/Devices.jsx'
import DeviceDetail from './pages/DeviceDetail.jsx'
import Rides from './pages/Rides.jsx'
import RideDetail from './pages/RideDetail.jsx'
import Fences from './pages/Fences.jsx'
import Social from './pages/Social.jsx'
import Clubs from './pages/Clubs.jsx'
import Events from './pages/Events.jsx'
import Topics from './pages/Topics.jsx'
import TopicDetail from './pages/TopicDetail.jsx'
import Service from './pages/Service.jsx'
import ServiceOrders from './pages/ServiceOrders.jsx'
import Shop from './pages/Shop.jsx'
import Orders from './pages/Orders.jsx'
import Privacy from './pages/Privacy.jsx'
import Admin from './pages/Admin.jsx'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      try {
        setUser(JSON.parse(userStr))
      } catch (e) {
        console.error('Failed to parse user data')
      }
    }
    setLoading(false)
  }, [location.pathname])

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-600">加载中...</div>
      </div>
    )
  }

  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" replace />
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Dashboard user={user} />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="/devices/:vin" element={<DeviceDetail />} />
        <Route path="/rides" element={<Rides />} />
        <Route path="/rides/:id" element={<RideDetail />} />
        <Route path="/fences" element={<Fences />} />
        <Route path="/social" element={<Social />} />
        <Route path="/clubs" element={<Clubs />} />
        <Route path="/events" element={<Events />} />
        <Route path="/topics" element={<Topics />} />
        <Route path="/topics/:id" element={<TopicDetail />} />
        <Route path="/service" element={<Service />} />
        <Route path="/service-orders" element={<ServiceOrders />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/privacy" element={<Privacy user={user} />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
