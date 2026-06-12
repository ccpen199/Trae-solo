import React, { useState, useEffect, createContext, useContext } from 'react'
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
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      try {
        setUser(JSON.parse(userStr))
      } catch (e) {
        console.error('Failed to parse user data')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      const res = await api.post('/auth/login', { username, password })
      const userData = res.data.user
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      return { success: true, user: userData }
    } catch (err) {
      const serverError = err.response?.data?.error
      let errorMsg = '登录失败，请检查网络连接'
      if (serverError) {
        if (serverError.includes('不存在') || serverError.includes('not found')) {
          errorMsg = '该账号不存在，请检查用户名或注册新账号'
        } else if (serverError.includes('密码') || serverError.includes('password') || serverError.includes('Invalid')) {
          errorMsg = '密码错误，请重新输入'
        } else if (serverError.includes('禁用') || serverError.includes('banned') || serverError.includes('disabled')) {
          errorMsg = '该账号已被禁用，请联系管理员'
        } else {
          errorMsg = serverError
        }
      }
      return { success: false, error: errorMsg }
    }
  }

  const register = async (username, password) => {
    try {
      const res = await api.post('/auth/register', { username, password })
      const userData = res.data.user
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      return { success: true, user: userData }
    } catch (err) {
      const serverError = err.response?.data?.error
      let errorMsg = '注册失败，请稍后重试'
      if (serverError) {
        if (serverError.includes('已存在') || serverError.includes('already exists')) {
          errorMsg = '该用户名已被注册，请更换其他用户名'
        } else if (serverError.includes('密码') && serverError.includes('6')) {
          errorMsg = '密码长度至少为6位'
        } else {
          errorMsg = serverError
        }
      }
      return { success: false, error: errorMsg }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const value = { user, login, register, logout, loading }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-gray-600">加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
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

  const from = location.state?.from?.pathname

  const onLoginSuccess = (userData) => {
    const target = from
      ? from
      : userData.role === 'admin'
        ? '/admin'
        : '/'
    navigate(target, { replace: true })
  }

  if (user) {
    const target = user.role === 'admin' ? '/admin' : '/'
    return <Navigate to={target} replace />
  }

  return (
    <Login
      onLoginSuccess={onLoginSuccess}
      onLogin={login}
      onRegister={register}
    />
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
