import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/Layout/MainLayout.jsx'
import ProtectedRoute from './components/Layout/ProtectedRoute.jsx'
import Login from './pages/Login/index.jsx'
import Dashboard from './pages/Dashboard/index.jsx'
import ParcelTrack from './pages/ParcelTrack/index.jsx'
import ParcelList from './pages/ParcelList/index.jsx'
import AnomalyAlert from './pages/AnomalyAlert/index.jsx'
import TraceChain from './pages/TraceChain/index.jsx'
import Pickup from './pages/Pickup/index.jsx'
import Shipping from './pages/Shipping/index.jsx'
import LargeItem from './pages/Shipping/LargeItem.jsx'
import Stations from './pages/Community/Stations.jsx'
import Posts from './pages/Community/Posts.jsx'
import Recycling from './pages/Community/Recycling.jsx'
import AdminParcels from './pages/Admin/Parcels.jsx'
import AdminOrders from './pages/Admin/Orders.jsx'
import AdminUsers from './pages/Admin/Users.jsx'
import AdminStats from './pages/Admin/Stats.jsx'

function getRedirectPath(role) {
  const map = {
    platform: '/admin/stats',
    ops: '/admin/stats',
    admin: '/admin/parcels',
    station_master: '/dashboard',
    user: '/dashboard',
  }
  return map[role] || '/dashboard'
}

function RoleRedirect() {
  const savedUser = localStorage.getItem('user')
  let role = 'user'
  try {
    role = JSON.parse(savedUser)?.role || 'user'
  } catch (e) { /* ignore */ }
  return <Navigate to={getRedirectPath(role)} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
        <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="track" element={<ProtectedRoute><ParcelTrack /></ProtectedRoute>} />
        <Route path="parcels" element={<ProtectedRoute><ParcelList /></ProtectedRoute>} />
        <Route path="anomaly" element={<ProtectedRoute><AnomalyAlert /></ProtectedRoute>} />
        <Route path="trace/:trackingNo" element={<ProtectedRoute><TraceChain /></ProtectedRoute>} />
        <Route path="pickup" element={<ProtectedRoute><Pickup /></ProtectedRoute>} />
        <Route path="shipping" element={<ProtectedRoute><Shipping /></ProtectedRoute>} />
        <Route path="shipping/regular" element={<ProtectedRoute><Shipping /></ProtectedRoute>} />
        <Route path="shipping/large" element={<ProtectedRoute><LargeItem /></ProtectedRoute>} />
        <Route path="community/stations" element={<ProtectedRoute><Stations /></ProtectedRoute>} />
        <Route path="community/posts" element={<ProtectedRoute><Posts /></ProtectedRoute>} />
        <Route path="community/recycling" element={<ProtectedRoute><Recycling /></ProtectedRoute>} />
        <Route path="admin/parcels" element={<ProtectedRoute requireAdmin><AdminParcels /></ProtectedRoute>} />
        <Route path="admin/orders" element={<ProtectedRoute requireAdmin><AdminOrders /></ProtectedRoute>} />
        <Route path="admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
        <Route path="admin/stats" element={<ProtectedRoute requireAdmin><AdminStats /></ProtectedRoute>} />
      </Route>
    </Routes>
  )
}

export default App
