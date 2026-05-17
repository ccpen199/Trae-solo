import React, { useState, useEffect, Component } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useStore } from './store'
import Home from './pages/Home'
import Lawyers from './pages/Lawyers'
import LawyerDetail from './pages/LawyerDetail'
import Messages from './pages/Messages'
import Profile from './pages/Profile'
import QuickConsult from './pages/QuickConsult'
import TextConsult from './pages/TextConsult'
import ConsultDetail from './pages/ConsultDetail'
import Login from './pages/Login'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('页面渲染错误:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page" style={{ textAlign: 'center', paddingTop: 100 }}>
          <h2 style={{ color: '#e74c3c', marginBottom: 16 }}>😢 页面加载出错</h2>
          <p style={{ color: '#666', marginBottom: 16 }}>{this.state.error?.message || '未知错误'}</p>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => window.location.reload()}>
            刷新页面
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const App = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = useStore()
  const [activeTab, setActiveTab] = useState('home')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const path = location.pathname
    if (path.includes('lawyers')) setActiveTab('lawyers')
    else if (path.includes('messages')) setActiveTab('messages')
    else if (path.includes('profile')) setActiveTab('profile')
    else setActiveTab('home')
  }, [location.pathname])

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  const navItems = [
    { key: 'home', label: '首页', icon: '🏠', path: '/' },
    { key: 'lawyers', label: '律师', icon: '⚖️', path: '/lawyers' },
    { key: 'messages', label: '消息', icon: '💬', path: '/messages' },
    { key: 'profile', label: '我的', icon: '👤', path: '/profile' },
  ]

  const hideNav = location.pathname.includes('admin') || 
    location.pathname.includes('login') ||
    location.pathname.includes('consult/') ||
    location.pathname.includes('quick') ||
    location.pathname.includes('text')

  return (
    <div className="app-container">
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home showToast={showToast} />} />
          <Route path="/login" element={<Login showToast={showToast} />} />
          <Route path="/lawyers" element={<Lawyers showToast={showToast} />} />
          <Route path="/lawyers/:id" element={<LawyerDetail showToast={showToast} />} />
          <Route path="/messages" element={<Messages showToast={showToast} />} />
          <Route path="/profile" element={<Profile showToast={showToast} />} />
          <Route path="/quick-consult" element={<QuickConsult showToast={showToast} />} />
          <Route path="/text-consult" element={<TextConsult showToast={showToast} />} />
          <Route path="/consult/:orderId" element={<ConsultDetail showToast={showToast} />} />
          <Route path="/admin/login" element={<AdminLogin showToast={showToast} />} />
          <Route path="/admin/dashboard" element={<AdminDashboard showToast={showToast} />} />
        </Routes>

        {!hideNav && (
          <div className="bottom-nav">
            {navItems.map((item) => (
              <div
                key={item.key}
                className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}
      </ErrorBoundary>
    </div>
  )
}

export default App
