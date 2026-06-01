import React, { useState, useEffect } from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import CaseList from './pages/CaseList'
import CaseDetail from './pages/CaseDetail'
import CaseRegister from './pages/CaseRegister'
import Login from './pages/Login'

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-logo">
          <h2>社区矛盾调解系统</h2>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
            📊 工作台
          </NavLink>
          <NavLink to="/cases" className={({ isActive }) => isActive ? 'active' : ''}>
            📋 案件列表
          </NavLink>
          <NavLink to="/register" className={({ isActive }) => isActive ? 'active' : ''}>
            ➕ 案件登记
          </NavLink>
        </nav>
        <div style={{ position: 'absolute', bottom: 0, width: '100%', padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ fontSize: '12px', opacity: 0.7 }}>当前用户：{user.name}</p>
          <button 
            onClick={handleLogout}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '13px', marginTop: '8px' }}
          >
            退出登录
          </button>
        </div>
      </div>
      <div className="main-content">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cases" element={<CaseList />} />
          <Route path="/cases/:id" element={<CaseDetail />} />
          <Route path="/register" element={<CaseRegister />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
