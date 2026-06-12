import { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Devices from './pages/Devices.jsx'
import DeviceDetail from './pages/DeviceDetail.jsx'
import Rides from './pages/Rides.jsx'
import RideDetail from './pages/RideDetail.jsx'
import Fences from './pages/Fences.jsx'
import Social from './pages/Social.jsx'
import Clubs from './pages/Clubs.jsx'
import Events from './pages/Events.jsx'
import Topics from './pages/Topics.jsx'
import TopicDetail from './pages/TopicDetail.jsx'
import Service from './pages/Service.jsx'
import ServiceOrders from './pages/ServiceOrders.jsx'
import Shop from './pages/Shop.jsx'
import Orders from './pages/Orders.jsx'
import Privacy from './pages/Privacy.jsx'
import Admin from './pages/Admin.jsx'
import UserCenter from './pages/UserCenter.jsx'
import api from './utils/api'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      if (stored) return JSON.parse(stored)
    } catch (e) { /* ignore */ }
    return null
  })

  const login = useCallback(async (username, password) => {
    try {
      const res = await api.post('/auth/login', { username, password })
      const userData = res.data.user
      const token = res.data.token
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      return { success: true, user: userData }
    } catch (err) {
      const msg = err.response?.data?.error
      if (msg) {
        if (msg.includes('不存在')) return { success: false, error: '该账号不存在，请检查用户名或注册新账号' }
        if (msg.includes('密码') || msg.includes('password') || msg.includes('Invalid')) return { success: false, error: '密码错误，请重新输入' }
        if (msg.includes('禁用') || msg.includes('banned')) return { success: false, error: '该账号已被禁用，请联系管理员' }
        return { success: false, error: msg }
      }
      return { success: false, error: '登录失败，请检查网络连接' }
    }
  }, [])

  const register = useCallback(async (username, password) => {
    try {
      const res = await api.post('/auth/register', { username, password })
      const userData = res.data.user
      const token = res.data.token
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      return { success: true, user: userData }
    } catch (err) {
      const msg = err.response?.data?.error
      if (msg) {
        if (msg.includes('已存在')) return { success: false, error: '该用户名已被注册，请更换其他用户名' }
        return { success: false, error: msg }
      }
      return { success: false, error: '注册失败，请稍后重试' }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

function ProtectedRoute({ requireAdmin = false }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

function MainLayout() {
  const { user, logout } = useAuth()
  return (
    <Layout user={user} onLogout={logout}>
      <Outlet />
    </Layout>
  )
}

function LoginPage() {
  const { login, register, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const navigatedRef = useRef(false)

  useEffect(() => {
    if (user && !navigatedRef.current) {
      navigatedRef.current = true
      const from = location.state?.from?.pathname
      const target = from
        ? from
        : user.role === 'admin'
          ? '/admin'
          : '/'
      navigate(target, { replace: true })
    }
  }, [user, navigate, location.state])

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-gray-600">登录成功，正在跳转...</div>
        </div>
      </div>
    )
  }

  return (
    <Login onLogin={login} onRegister={register} />
  )
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/user-center" element={<UserCenter />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/devices/:vin" element={<DeviceDetail />} />
            <Route path="/rides" element={<Rides />} />
            <Route path="/rides/:id" element={<RideDetail />} />
            <Route path="/fences" element={<Fences />} />
            <Route path="/social" element={<Social />} />
            <Route path="/clubs" element={<Clubs />} />
            <Route path="/events" element={<Events />} />
            <Route path="/topics" element={<Topics />} />
            <Route path="/topics/:id" element={<TopicDetail />} />
            <Route path="/service" element={<Service />} />
            <Route path="/service-orders" element={<ServiceOrders />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/privacy" element={<Privacy />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute requireAdmin={true} />}>
          <Route element={<MainLayout />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
