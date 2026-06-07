import React, { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useNavigate, Navigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Cpu, Search, Sparkles, Wrench, ShoppingBag,
  Repeat, Zap, Star, HardDrive, GitBranch, Radio, HeartPulse,
  LogOut, Menu, X, User, Loader2
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { authAPI } from './api'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import DeviceList from './pages/DeviceList'
import DeviceDiscover from './pages/DeviceDiscover'
import SceneList from './pages/SceneList'
import ServiceList from './pages/ServiceList'
import ProductList from './pages/ProductList'
import TradeIn from './pages/TradeIn'
import EnergyDashboard from './pages/EnergyDashboard'
import PointsCenter from './pages/PointsCenter'
import FirmwareConsole from './pages/FirmwareConsole'
import ChannelManager from './pages/ChannelManager'
import IRBridgeManager from './pages/IRBridgeManager'
import DeviceHealth from './pages/DeviceHealth'

type UserRole = 'admin' | 'platform' | 'ops' | 'user'

interface UserInfo {
  id: string
  username: string
  role: UserRole
  email?: string
}

interface NavItem {
  path: string
  label: string
  icon: LucideIcon
}

const roleNavItems: Record<UserRole, NavItem[]> = {
  admin: [
    { path: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
    { path: '/devices', label: '设备管理', icon: Cpu },
    { path: '/devices/discover', label: '设备发现', icon: Search },
    { path: '/scenes', label: '场景引擎', icon: Sparkles },
    { path: '/services', label: '服务工单', icon: Wrench },
    { path: '/products', label: '智家商城', icon: ShoppingBag },
    { path: '/tradein', label: '以旧换新', icon: Repeat },
    { path: '/energy', label: '能耗监控', icon: Zap },
    { path: '/points', label: '积分中心', icon: Star },
    { path: '/firmware', label: '固件管理', icon: HardDrive },
    { path: '/channels', label: '渠道管理', icon: GitBranch },
    { path: '/ir-bridges', label: '红外网关', icon: Radio },
    { path: '/device-health', label: '设备健康', icon: HeartPulse },
  ],
  platform: [
    { path: '/services', label: '服务工单', icon: Wrench },
    { path: '/products', label: '智家商城', icon: ShoppingBag },
    { path: '/tradein', label: '以旧换新', icon: Repeat },
    { path: '/channels', label: '渠道管理', icon: GitBranch },
    { path: '/points', label: '积分中心', icon: Star },
    { path: '/energy', label: '能耗监控', icon: Zap },
    { path: '/devices', label: '设备管理', icon: Cpu },
  ],
  ops: [
    { path: '/firmware', label: '固件管理', icon: HardDrive },
    { path: '/device-health', label: '设备健康', icon: HeartPulse },
    { path: '/devices', label: '设备管理', icon: Cpu },
    { path: '/devices/discover', label: '设备发现', icon: Search },
    { path: '/ir-bridges', label: '红外网关', icon: Radio },
    { path: '/services', label: '服务工单', icon: Wrench },
    { path: '/energy', label: '能耗监控', icon: Zap },
  ],
  user: [
    { path: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
    { path: '/devices', label: '设备管理', icon: Cpu },
    { path: '/scenes', label: '场景引擎', icon: Sparkles },
    { path: '/energy', label: '能耗监控', icon: Zap },
    { path: '/points', label: '积分中心', icon: Star },
  ],
}

const roleLabels: Record<UserRole, string> = {
  admin: '超级管理员',
  platform: '平台运营',
  ops: '运维工程师',
  user: '普通用户',
}

const roleBadgeColors: Record<UserRole, { bg: string; color: string }> = {
  admin: { bg: '#fff1f0', color: '#cf1322' },
  platform: { bg: '#e6f7ff', color: '#1890ff' },
  ops: { bg: '#f6ffed', color: '#52c41a' },
  user: { bg: '#fffbe6', color: '#d48806' },
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', height: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#f0f2f5' },
  sidebar: { width: 240, background: 'linear-gradient(180deg, #001529 0%, #002140 100%)', color: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width 0.3s ease' },
  sidebarCollapsed: { width: 72, background: 'linear-gradient(180deg, #001529 0%, #002140 100%)', color: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width 0.3s ease' },
  logo: { padding: '18px 20px', fontSize: 16, fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap', overflow: 'hidden' },
  logoIcon: { width: 36, height: 36, background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 },
  nav: { flex: 1, overflowY: 'auto', padding: '12px 8px' },
  navItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 14, transition: 'all 0.2s', cursor: 'pointer', borderRadius: 8, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden' },
  navItemHover: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', color: '#fff', textDecoration: 'none', fontSize: 14, transition: 'all 0.2s', cursor: 'pointer', borderRadius: 8, marginBottom: 4, background: 'rgba(255,255,255,0.08)', whiteSpace: 'nowrap', overflow: 'hidden' },
  navItemActive: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', color: '#fff', textDecoration: 'none', fontSize: 14, transition: 'all 0.2s', cursor: 'pointer', borderRadius: 8, marginBottom: 4, background: 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)', boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)', whiteSpace: 'nowrap', overflow: 'hidden' },
  navItemIcon: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  navItemText: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' },
  sidebarFooter: { padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  logoutItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 14, transition: 'all 0.2s', cursor: 'pointer', borderRadius: 8, whiteSpace: 'nowrap', overflow: 'hidden' },
  logoutItemHover: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', color: '#ff4d4f', textDecoration: 'none', fontSize: 14, transition: 'all 0.2s', cursor: 'pointer', borderRadius: 8, background: 'rgba(255,77,79,0.1)', whiteSpace: 'nowrap', overflow: 'hidden' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { height: 64, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', flexShrink: 0 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  toggleBtn: { background: 'none', border: 'none', color: '#595959', cursor: 'pointer', padding: 8, display: 'flex', alignItems: 'center', borderRadius: 8, transition: 'all 0.2s' },
  toggleBtnHover: { background: '#f5f5f5', border: 'none', color: '#262626', cursor: 'pointer', padding: 8, display: 'flex', alignItems: 'center', borderRadius: 8, transition: 'all 0.2s' },
  headerTitle: { fontSize: 18, fontWeight: 600, color: '#1a1a1a' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 16 },
  roleBadge: { padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 },
  userInfo: { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', background: '#f5f5f5', borderRadius: 8 },
  userAvatar: { width: 32, height: 32, background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 600 },
  username: { fontSize: 14, color: '#262626', fontWeight: 500 },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid #d9d9d9', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#595959', transition: 'all 0.2s' },
  logoutBtnHover: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid #ff4d4f', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#ff4d4f', transition: 'all 0.2s' },
  content: { flex: 1, overflowY: 'auto', padding: 24 },
  loadingContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0f2f5' },
  loadingBox: { textAlign: 'center' as const, padding: 40 },
  loadingText: { marginTop: 16, color: '#8c8c8c', fontSize: 14 },
}

function useAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    navigate('/login', { replace: true })
  }

  const saveToken = (t: string, u?: UserInfo) => {
    localStorage.setItem('token', t)
    setToken(t)
    if (u) {
      localStorage.setItem('user', JSON.stringify(u))
      setUser(u)
    }
  }

  const setUserInfo = (u: UserInfo) => {
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
  }

  return { token, user, loading, setLoading, logout, saveToken, setUserInfo }
}

function ProtectedRoute({ children, token }: { children: React.ReactNode; token: string | null }) {
  const location = useLocation()
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}

export default function App() {
  const { token, user, loading, setLoading, logout, saveToken, setUserInfo } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [logoutHover, setLogoutHover] = useState(false)
  const [toggleHover, setToggleHover] = useState(false)
  const [hoveredNavItem, setHoveredNavItem] = useState<string | null>(null)
  const [sidebarLogoutHover, setSidebarLogoutHover] = useState(false)

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!token) return

      const cachedUser = localStorage.getItem('user')
      if (cachedUser) {
        try {
          const parsedUser = JSON.parse(cachedUser)
          setUserInfo(parsedUser)
        } catch (e) {
          console.error('Failed to parse cached user:', e)
        }
      }

      setLoading(true)
      try {
        const res = await authAPI.getMe()
        const userData = res.data?.data?.user || res.data?.data || res.data?.user
        if (userData) {
          setUserInfo(userData)
        }
      } catch (err: any) {
        console.error('Failed to fetch user info:', err)
        if (err.response?.status === 401) {
          logout()
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUserInfo()
  }, [token])

  useEffect(() => {
    if (!loading) return
    const timer = setTimeout(() => setLoading(false), 3000)
    return () => clearTimeout(timer)
  }, [loading])

  useEffect(() => {
    if (token && location.pathname === '/login') {
      navigate('/dashboard', { replace: true })
    }
  }, [token, location.pathname, navigate])

  const navItems = user?.role ? roleNavItems[user.role] : []

  if (loading && token) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingBox}>
          <Loader2 size={40} color="#1890ff" style={{ animation: 'spin 1s linear infinite' }} />
          <div style={styles.loadingText}>正在加载用户信息...</div>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (!token) {
    return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  return (
    <div style={styles.container}>
      <div style={collapsed ? styles.sidebarCollapsed : styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>海</div>
          {!collapsed && <span>海尔智家IoT</span>}
        </div>

        <div style={styles.nav}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
            const isHovered = hoveredNavItem === item.path

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                style={isActive ? styles.navItemActive : (isHovered ? styles.navItemHover : styles.navItem)}
                onMouseEnter={() => setHoveredNavItem(item.path)}
                onMouseLeave={() => setHoveredNavItem(null)}
              >
                <span style={styles.navItemIcon}>
                  <item.icon size={20} />
                </span>
                {!collapsed && <span style={styles.navItemText}>{item.label}</span>}
              </NavLink>
            )
          })}
        </div>

        <div style={styles.sidebarFooter}>
          <div
            style={sidebarLogoutHover ? styles.logoutItemHover : styles.logoutItem}
            onMouseEnter={() => setSidebarLogoutHover(true)}
            onMouseLeave={() => setSidebarLogoutHover(false)}
            onClick={logout}
          >
            <span style={styles.navItemIcon}>
              <LogOut size={20} />
            </span>
            {!collapsed && <span style={styles.navItemText}>退出登录</span>}
          </div>
        </div>
      </div>

      <div style={styles.main}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <button
              style={toggleHover ? styles.toggleBtnHover : styles.toggleBtn}
              onClick={() => setCollapsed(!collapsed)}
              onMouseEnter={() => setToggleHover(true)}
              onMouseLeave={() => setToggleHover(false)}
            >
              {collapsed ? <Menu size={20} /> : <X size={20} />}
            </button>
            <span style={styles.headerTitle}>海尔智家IoT控制平台</span>
          </div>

          <div style={styles.headerRight}>
            {user && (
              <div
                style={{
                  ...styles.roleBadge,
                  background: roleBadgeColors[user.role].bg,
                  color: roleBadgeColors[user.role].color,
                }}
              >
                <User size={14} />
                {roleLabels[user.role]}
              </div>
            )}
            <div style={styles.userInfo}>
              <div style={styles.userAvatar}>
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span style={styles.username}>{user?.username || '用户'}</span>
            </div>
            <button
              style={logoutHover ? styles.logoutBtnHover : styles.logoutBtn}
              onClick={logout}
              onMouseEnter={() => setLogoutHover(true)}
              onMouseLeave={() => setLogoutHover(false)}
            >
              <LogOut size={14} />
              退出
            </button>
          </div>
        </div>

        <div style={styles.content}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={
              <ProtectedRoute token={token}><Dashboard /></ProtectedRoute>
            } />
            <Route path="/devices" element={
              <ProtectedRoute token={token}><DeviceList /></ProtectedRoute>
            } />
            <Route path="/devices/discover" element={
              <ProtectedRoute token={token}><DeviceDiscover /></ProtectedRoute>
            } />
            <Route path="/scenes" element={
              <ProtectedRoute token={token}><SceneList /></ProtectedRoute>
            } />
            <Route path="/services" element={
              <ProtectedRoute token={token}><ServiceList /></ProtectedRoute>
            } />
            <Route path="/products" element={
              <ProtectedRoute token={token}><ProductList /></ProtectedRoute>
            } />
            <Route path="/tradein" element={
              <ProtectedRoute token={token}><TradeIn /></ProtectedRoute>
            } />
            <Route path="/energy" element={
              <ProtectedRoute token={token}><EnergyDashboard /></ProtectedRoute>
            } />
            <Route path="/points" element={
              <ProtectedRoute token={token}><PointsCenter /></ProtectedRoute>
            } />
            <Route path="/firmware" element={
              <ProtectedRoute token={token}><FirmwareConsole /></ProtectedRoute>
            } />
            <Route path="/channels" element={
              <ProtectedRoute token={token}><ChannelManager /></ProtectedRoute>
            } />
            <Route path="/ir-bridges" element={
              <ProtectedRoute token={token}><IRBridgeManager /></ProtectedRoute>
            } />
            <Route path="/device-health" element={
              <ProtectedRoute token={token}><DeviceHealth /></ProtectedRoute>
            } />
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
