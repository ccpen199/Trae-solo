import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store'
import api from './api'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Providers from './pages/Providers'
import ProviderDetail from './pages/ProviderDetail'
import Requirements from './pages/Requirements'
import RequirementDetail from './pages/RequirementDetail'
import PostRequirement from './pages/PostRequirement'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Profile from './pages/Profile'
import SkillProfile from './pages/SkillProfile'
import ProviderDashboard from './pages/ProviderDashboard'
import ClientDashboard from './pages/ClientDashboard'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminDisputes from './pages/admin/Disputes'

function PrivateRoute({ children, requireRole }) {
  const { user, token } = useStore()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (requireRole && user && !requireRole.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  const { token, setUser, user } = useStore()

  useEffect(() => {
    if (token && !user) {
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => {
          useStore.getState().logout()
        })
    }
  }, [token, setUser, user])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="providers" element={<Providers />} />
        <Route path="providers/:id" element={<ProviderDetail />} />
        <Route path="requirements" element={<Requirements />} />
        <Route path="requirements/:id" element={<RequirementDetail />} />
        <Route path="post-requirement" element={
          <PrivateRoute><PostRequirement /></PrivateRoute>
        } />
        <Route path="orders" element={
          <PrivateRoute><Orders /></PrivateRoute>
        } />
        <Route path="orders/:id" element={
          <PrivateRoute><OrderDetail /></PrivateRoute>
        } />
        <Route path="profile" element={
          <PrivateRoute><Profile /></PrivateRoute>
        } />
        <Route path="skill-profile" element={
          <PrivateRoute requireRole={['provider']}><SkillProfile /></PrivateRoute>
        } />

        <Route path="provider/dashboard" element={
          <PrivateRoute requireRole={['provider']}><ProviderDashboard /></PrivateRoute>
        } />
        <Route path="client/dashboard" element={
          <PrivateRoute requireRole={['client']}><ClientDashboard /></PrivateRoute>
        } />
        
        <Route path="admin/dashboard" element={
          <PrivateRoute requireRole={['admin']}><AdminDashboard /></PrivateRoute>
        } />
        <Route path="admin/users" element={
          <PrivateRoute requireRole={['admin']}><AdminUsers /></PrivateRoute>
        } />
        <Route path="admin/disputes" element={
          <PrivateRoute requireRole={['admin']}><AdminDisputes /></PrivateRoute>
        } />

        <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

export default App
