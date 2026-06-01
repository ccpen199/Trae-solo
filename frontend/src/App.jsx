import React, { useState, useEffect } from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Doctors from './pages/Doctors'
import VisitPlans from './pages/VisitPlans'
import VisitRecords from './pages/VisitRecords'
import Compliance from './pages/Compliance'
import Materials from './pages/Materials'
import Reports from './pages/Reports'

const navItems = [
  { path: '/dashboard', label: '数据看板', icon: '📊' },
  { path: '/doctors', label: '医生档案', icon: '👨‍⚕️' },
  { path: '/visit-plans', label: '拜访计划', icon: '📅' },
  { path: '/visit-records', label: '拜访执行', icon: '📝' },
  { path: '/compliance', label: '合规审核', icon: '✅' },
  { path: '/materials', label: '学术资料', icon: '📚' },
  { path: '/reports', label: '经理报表', icon: '📈' },
]

function App() {
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    setCurrentUser({ id: 'rep001', name: '张代表', role: 'representative' })
  }, [])

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          🏥 医药拜访系统
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => isActive ? 'active' : ''}>
              {item.icon} {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main">
        <header className="header">
          <div className="header-title">医药代表拜访管理系统</div>
          <div className="header-user">
            <span>欢迎，{currentUser?.name}</span>
          </div>
        </header>
        <div className="content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/visit-plans" element={<VisitPlans />} />
            <Route path="/visit-records" element={<VisitRecords />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App
