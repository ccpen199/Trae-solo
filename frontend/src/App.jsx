import React, { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Button, Layout, Menu, Space } from 'antd'
import {
  HomeOutlined,
  LoginOutlined,
  LogoutOutlined,
  ShopOutlined,
  UserOutlined,
  VideoCameraOutlined
} from '@ant-design/icons'
import 'antd/dist/reset.css'

import Home from './pages/Home'
import Movies from './pages/Movies'
import MovieDetail from './pages/MovieDetail'
import Cinemas from './pages/Cinemas'
import CinemaDetail from './pages/CinemaDetail'
import SeatSelection from './pages/SeatSelection'
import OrderConfirm from './pages/OrderConfirm'
import Login from './pages/Login'
import Register from './pages/Register'
import UserCenter from './pages/UserCenter'
import AdminLayout from './pages/admin/Layout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminCinemas from './pages/admin/Cinemas'
import AdminMovies from './pages/admin/Movies'
import AdminSessions from './pages/admin/Sessions'
import AdminCoupons from './pages/admin/Coupons'
import AdminLogs from './pages/admin/Logs'

const { Header, Content } = Layout

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

function getRoleLabel(role) {
  const labels = {
    user: '普通用户',
    operator: '影城运营员',
    regional_admin: '区域管理员',
    hq_auditor: '总部审核员',
    admin: '超级管理员'
  }
  return labels[role] || role
}

function PublicLayout({ user, onLogout, children }) {
  const location = useLocation()
  const navigate = useNavigate()

  const selectedKey = useMemo(() => {
    if (location.pathname.startsWith('/movies')) return '/movies'
    if (location.pathname.startsWith('/cinemas')) return '/cinemas'
    if (location.pathname.startsWith('/user')) return '/user'
    return '/'
  }, [location.pathname])

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: <Link to="/">首页</Link> },
    { key: '/movies', icon: <VideoCameraOutlined />, label: <Link to="/movies">电影</Link> },
    { key: '/cinemas', icon: <ShopOutlined />, label: <Link to="/cinemas">影院</Link> }
  ]

  if (user) {
    menuItems.push({ key: '/user', icon: <UserOutlined />, label: <Link to="/user">我的</Link> })
  }

  const adminRoles = ['operator', 'regional_admin', 'hq_auditor', 'admin']
  const showAdmin = user && adminRoles.includes(user.role)

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <Link className="app-brand" to="/">PinAI 影城</Link>
        <Menu
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={menuItems}
          className="app-menu"
        />
        <Space className="app-actions">
          {showAdmin && (
            <Button type="primary" onClick={() => navigate('/admin/dashboard')}>
              管理后台 ({getRoleLabel(user.role)})
            </Button>
          )}
          {user ? (
            <Space>
              <span style={{ color: '#666' }}>
                <UserOutlined style={{ marginRight: 4 }} />
                {user.nickname || user.username}
              </span>
              <Button icon={<LogoutOutlined />} onClick={onLogout}>
                退出
              </Button>
            </Space>
          ) : (
            <Button type="primary" icon={<LoginOutlined />} onClick={() => navigate('/login')}>
              登录
            </Button>
          )}
        </Space>
      </Header>
      <Content className="app-content">{children}</Content>
    </Layout>
  )
}

function PublicRoutes({ user, onLogin, onLogout }) {
  return (
    <PublicLayout user={user} onLogout={onLogout}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/:id" element={<MovieDetail />} />
        <Route path="/cinemas" element={<Cinemas />} />
        <Route path="/cinemas/:id" element={<CinemaDetail />} />
        <Route path="/sessions/:id" element={<SeatSelection />} />
        <Route path="/order-confirm" element={<OrderConfirm />} />
        <Route path="/login" element={<Login onLogin={onLogin} />} />
        <Route path="/register" element={<Register onLogin={onLogin} />} />
        <Route path="/user" element={<UserCenter />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PublicLayout>
  )
}

function AppRoutes({ user, onLogin, onLogout }) {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="cinemas" element={<AdminCinemas />} />
        <Route path="movies" element={<AdminMovies />} />
        <Route path="sessions" element={<AdminSessions />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="logs" element={<AdminLogs />} />
      </Route>
      <Route path="/*" element={<PublicRoutes user={user} onLogin={onLogin} onLogout={onLogout} />} />
    </Routes>
  )
}

function App() {
  const [user, setUser] = useState(() => readStoredUser())

  useEffect(() => {
    const handleStorage = () => setUser(readStoredUser())
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const handleLogin = nextUser => setUser(nextUser)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <BrowserRouter>
      <AppRoutes user={user} onLogin={handleLogin} onLogout={handleLogout} />
    </BrowserRouter>
  )
}

export default App
