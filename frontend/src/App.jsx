import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Habits from './pages/Habits'
import Explore from './pages/Explore'
import Circles from './pages/Circles'
import Profile from './pages/Profile'
import Merchant from './pages/Merchant'
import TransactionDetail from './pages/TransactionDetail'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" />
}

function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f5f5f5',
        fontSize: '16px',
        color: '#666'
      }}>
        加载中...
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Habits />} />
          <Route path="explore" element={<Explore />} />
          <Route path="circles" element={<Circles />} />
          <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="merchant" element={<ProtectedRoute><Merchant /></ProtectedRoute>} />
          <Route path="transaction/:id" element={<TransactionDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
