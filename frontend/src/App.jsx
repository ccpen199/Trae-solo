import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { authAPI } from './api'
import Layout from './components/Layout'
import Login from './pages/Login'
import Home from './pages/Home'
import Pets from './pages/Pets'
import PetDetail from './pages/PetDetail'
import Services from './pages/Services'
import BookService from './pages/BookService'
import Appointments from './pages/Appointments'
import AppointmentDetail from './pages/AppointmentDetail'
import ServiceProgress from './pages/ServiceProgress'
import Transport from './pages/Transport'
import Records from './pages/Records'
import RecordDetail from './pages/RecordDetail'
import Fees from './pages/Fees'
import Reviews from './pages/Reviews'
import Complaints from './pages/Complaints'
import StoreManage from './pages/StoreManage'
import Dashboard from './pages/Dashboard'
import NotFound from './pages/NotFound'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
      setLoading(false)
    } else if (!location.pathname.includes('/login') && !location.pathname.includes('/register')) {
      navigate('/login')
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [navigate, location.pathname])

  const handleLogin = async (data) => {
    try {
      const res = await authAPI.login(data)
      const { token, user } = res.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      navigate('/')
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || '登录失败' }
    }
  }

  const handleRegister = async (data) => {
    try {
      const res = await authAPI.register(data)
      const { token, user } = res.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      navigate('/')
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || '注册失败' }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  if (!user && (location.pathname === '/login' || location.pathname === '/register')) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} onRegister={handleRegister} />} />
        <Route path="/register" element={<Login onLogin={handleLogin} onRegister={handleRegister} isRegister />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/login" element={<Navigate to="/" />} />
        <Route path="/pets" element={<Pets user={user} />} />
        <Route path="/pets/:id" element={<PetDetail user={user} />} />
        <Route path="/services" element={<Services user={user} />} />
        <Route path="/book/:serviceId" element={<BookService user={user} />} />
        <Route path="/appointments" element={<Appointments user={user} />} />
        <Route path="/appointments/:id" element={<AppointmentDetail user={user} />} />
        <Route path="/progress/:id" element={<ServiceProgress user={user} />} />
        <Route path="/transport" element={<Transport user={user} />} />
        <Route path="/records" element={<Records user={user} />} />
        <Route path="/records/:id" element={<RecordDetail user={user} />} />
        <Route path="/fees" element={<Fees user={user} />} />
        <Route path="/reviews" element={<Reviews user={user} />} />
        <Route path="/complaints" element={<Complaints user={user} />} />
        <Route path="/store" element={<StoreManage user={user} />} />
        <Route path="/dashboard" element={<Dashboard user={user} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}

export default App
