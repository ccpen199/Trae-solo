import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Schemes from './pages/Schemes'
import Applications from './pages/Applications'
import Profile from './pages/Profile'
import MainLayout from './components/MainLayout'

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="students" element={<Students />} />
        <Route path="schemes" element={<Schemes />} />
        <Route path="applications" element={<Applications />} />
      </Route>
    </Routes>
  )
}

export default App
