import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import ResidentPage from './pages/ResidentPage'
import EnterprisePage from './pages/EnterprisePage'
import EVPage from './pages/EVPage'
import PVPage from './pages/PVPage'
import AdminPage from './pages/AdminPage'
import { healthCheck } from './services/api'

function App() {
  const [activeTab, setActiveTab] = useState('resident')
  const [systemStatus, setSystemStatus] = useState('checking')
  const location = useLocation()

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await healthCheck()
        setSystemStatus('healthy')
      } catch (error) {
        setSystemStatus('error')
      }
    }
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const path = location.pathname
    if (path.includes('enterprise')) setActiveTab('enterprise')
    else if (path.includes('ev')) setActiveTab('ev')
    else if (path.includes('pv')) setActiveTab('pv')
    else if (path.includes('admin')) setActiveTab('admin')
    else setActiveTab('resident')
  }, [location])

  return (
    <div className="app-container">
      <header className="header">
        <h1>⚡ 国家电网省级统一电力服务中台</h1>
        <p>面向居民、企事业、电动汽车车主、分布式光伏业主的数字化服务平台</p>
        <div style={{ marginTop: '1rem', fontSize: '0.875rem', opacity: 0.9 }}>
          系统状态: {
            systemStatus === 'healthy' ? '🟢 运行正常' :
            systemStatus === 'checking' ? '🟡 检查中...' :
            '🔴 连接异常'
          }
        </div>
      </header>

      <nav className="nav-tabs">
        <Link to="/" className={`nav-tab ${activeTab === 'resident' ? 'active' : ''}`}>
          🏠 居民服务
        </Link>
        <Link to="/enterprise" className={`nav-tab ${activeTab === 'enterprise' ? 'active' : ''}`}>
          🏢 企事业服务
        </Link>
        <Link to="/ev" className={`nav-tab ${activeTab === 'ev' ? 'active' : ''}`}>
          🚗 电动汽车服务
        </Link>
        <Link to="/pv" className={`nav-tab ${activeTab === 'pv' ? 'active' : ''}`}>
          ☀️ 光伏业主服务
        </Link>
        <Link to="/admin" className={`nav-tab ${activeTab === 'admin' ? 'active' : ''}`}>
          ⚙️ 后台管理
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<ResidentPage />} />
        <Route path="/enterprise" element={<EnterprisePage />} />
        <Route path="/ev" element={<EVPage />} />
        <Route path="/pv" element={<PVPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </div>
  )
}

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  )
}

export default AppWrapper
