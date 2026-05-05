import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import AppLayout from './components/Layout'
import Login from './pages/Login'
import UserList from './pages/user/UserList'
import Dashboard from './pages/Dashboard'

const PrivateRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="user" element={<UserList />} />
        <Route path="role" element={<Dashboard />} />
        <Route path="terminal" element={<Dashboard />} />
        <Route path="material" element={<Dashboard />} />
        <Route path="layout" element={<Dashboard />} />
        <Route path="program" element={<Dashboard />} />
        <Route path="schedule" element={<Dashboard />} />
        <Route path="log" element={<Dashboard />} />
        <Route path="system" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}

export default App
