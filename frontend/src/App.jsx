import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import IncidentReport from './pages/IncidentReport'
import IncidentList from './pages/IncidentList'
import IncidentDetail from './pages/IncidentDetail'
import api from './api'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
      api.get('/auth/me').catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
      })
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData, token) => {
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
    return <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>
  }

  return (
    <BrowserRouter>
      {user ? (
        <AuthenticatedApp user={user} onLogout={handleLogout} />
      ) : (
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </BrowserRouter>
  )
}

function AuthenticatedApp({ user, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { path: '/', label: '安全看板' },
    { path: '/report', label: '事件上报' },
    { path: '/incidents', label: '事件列表' }
  ]

  return (
    <div>
      <header className="header">
        <div className="header-content">
          <h1>🏫 校园安全事件上报系统</h1>
          <nav className="nav">
            {navItems.map(item => (
              <a
                key={item.path}
                href={item.path}
                className={location.pathname === item.path ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); navigate(item.path) }}
              >
                {item.label}
              </a>
            ))}
            <span style={{ padding: '8px 16px', opacity: 0.9 }}>
              {user.name} ({getRoleLabel(user.role)})
            </span>
            <button onClick={onLogout}>退出</button>
          </nav>
        </div>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/report" element={<IncidentReport />} />
          <Route path="/incidents" element={<IncidentList />} />
          <Route path="/incidents/:id" element={<IncidentDetail />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}

function getRoleLabel(role) {
  const labels = {
    admin: '管理员',
    student: '学生',
    teacher: '教师',
    security: '安保',
    doctor: '校医',
    manager: '管理者'
  }
  return labels[role] || role
}

export default App