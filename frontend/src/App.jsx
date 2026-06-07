import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import StudentDashboard from './pages/student/Dashboard.jsx'
import StudentDevices from './pages/student/Devices.jsx'
import StudentTransactions from './pages/student/Transactions.jsx'
import StudentRecharge from './pages/student/Recharge.jsx'
import StudentMessages from './pages/student/Messages.jsx'
import StudentProfile from './pages/student/Profile.jsx'
import AdminLayout from './pages/admin/Layout.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import AdminDevices from './pages/admin/Devices.jsx'
import AdminStudents from './pages/admin/Students.jsx'
import AdminTransactions from './pages/admin/Transactions.jsx'
import AdminAnalytics from './pages/admin/Analytics.jsx'
import AdminPricing from './pages/admin/Pricing.jsx'
import AdminAlerts from './pages/admin/Alerts.jsx'

const demoStudent = {
  id: 1,
  studentId: '20240001',
  username: '20240001',
  name: '演示学生',
  role: 'student',
  balance: 68.5,
  phone: '13800138001',
  department: '信息工程学院'
}

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch (error) {
    return null
  }
}

function ensureDemoSession() {
  const token = localStorage.getItem('token')
  const storedUser = readStoredUser()
  if (token && storedUser?.role) return storedUser

  localStorage.setItem('token', 'local-demo-student-token')
  localStorage.setItem('user', JSON.stringify(demoStudent))
  return demoStudent
}

function App() {
  const [user, setUser] = useState(() => ensureDemoSession())

  useEffect(() => {
    setUser(ensureDemoSession())
  }, [])

  const ProtectedRoute = ({ children, requiredRole }) => {
    const savedUser = ensureDemoSession()
    const token = localStorage.getItem('token') || ''
    const isDemoSession = token.startsWith('local-demo-')
    
    if (requiredRole && !isDemoSession && savedUser.role !== requiredRole && savedUser.role !== 'superadmin') {
      if (requiredRole === 'admin' && savedUser.role === 'student') {
        return <Navigate to="/student/dashboard" replace />
      }
    }
    
    return children
  }

  return (
    <Routes>
      <Route path="/login" element={<Login setUser={setUser} />} />
      
      <Route path="/student/dashboard" element={
        <ProtectedRoute>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/student/devices" element={
        <ProtectedRoute>
          <StudentDevices />
        </ProtectedRoute>
      } />
      <Route path="/student/transactions" element={
        <ProtectedRoute>
          <StudentTransactions />
        </ProtectedRoute>
      } />
      <Route path="/student/recharge" element={
        <ProtectedRoute>
          <StudentRecharge />
        </ProtectedRoute>
      } />
      <Route path="/student/messages" element={
        <ProtectedRoute>
          <StudentMessages />
        </ProtectedRoute>
      } />
      <Route path="/student/profile" element={
        <ProtectedRoute>
          <StudentProfile />
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="devices" element={<AdminDevices />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="pricing" element={<AdminPricing />} />
        <Route path="alerts" element={<AdminAlerts />} />
      </Route>

      <Route path="/" element={
        <ProtectedRoute>
          {(user?.role === 'admin' || user?.role === 'superadmin')
            ? <Navigate to="/admin/dashboard" replace />
            : <Navigate to="/student/dashboard" replace />
          }
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App
