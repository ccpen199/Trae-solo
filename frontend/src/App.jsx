import React, { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate, Outlet, Link } from 'react-router-dom'
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
import api from './utils/api'

const AuthContext = createContext(null)

const demoUser = {
  id: 1,
  username: 'admin',
  email: 'admin@smart-mobility.com',
  nickname: '系统管理员',
  avatar: '',
  n_coins: 10000,
  role: 'admin',
}

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
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    } else {
      const demoToken = localStorage.getItem('demo_token') || 'local-demo-token'
      localStorage.setItem('demo_token', demoToken)
      localStorage.setItem('token', demoToken)
      localStorage.setItem('user', JSON.stringify(demoUser))
      setUser(demoUser)
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
        if (serverError.includes('用户不存在') || serverError.includes('不存在')) {
          errorMsg = '账号不存在，请检查用户名或注册新账号'
        } else if (serverError.includes('密码') || serverError.includes('错误')) {
          errorMsg = '密码错误，请重新输入或忘记密码？'
        } else if (serverError.includes('禁用') || serverError.includes('locked')) {
          errorMsg = '账号已被禁用，请联系管理员'
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
        if (serverError.includes('已存在') || serverError.includes('用户名')) {
          errorMsg = '该用户名已被注册，请更换其他用户名'
        } else if (serverError.includes('密码') && serverError.includes('长度')) {
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
    if (from) {
      navigate(from, { replace: true })
    } else if (userData.role === 'admin') {
      navigate('/admin', { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }

  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/" replace />
  }

  return (
    <Login
      onLoginSuccess={onLoginSuccess}
      onLogin={(u, p) => login(u, p)}
      onRegister={(u, p) => register(u, p)}
    />
  )
}

function UserCenter() {
  const { user } = useAuth()
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800">个人中心</h2>
        <p className="text-sm text-gray-500 mt-1">我的账户、设备、订单和服务工单</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          <div className="bg-primary-50 rounded-lg p-4">
            <div className="text-sm text-primary-700">用户</div>
            <div className="font-semibold text-gray-800 mt-1">{user?.nickname || user?.username}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-sm text-yellow-700">N币余额</div>
            <div className="font-semibold text-gray-800 mt-1">{user?.n_coins || 0}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-700">角色</div>
            <div className="font-semibold text-gray-800 mt-1">{user?.role === 'admin' ? '管理员' : '普通用户'}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-700">邮箱</div>
            <div className="font-semibold text-gray-800 mt-1 truncate">{user?.email}</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/devices" className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md">
          <div className="text-3xl mb-2">🛴</div>
          <div className="font-medium text-gray-800">我的设备</div>
          <div className="text-sm text-gray-500 mt-1">查看绑定设备与固件状态</div>
        </Link>
        <Link to="/orders" className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md">
          <div className="text-3xl mb-2">📦</div>
          <div className="font-medium text-gray-800">我的订单</div>
          <div className="text-sm text-gray-500 mt-1">购买、预订与开箱验机</div>
        </Link>
        <Link to="/service-orders" className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md">
          <div className="text-3xl mb-2">📋</div>
          <div className="font-medium text-gray-800">我的工单</div>
          <div className="text-sm text-gray-500 mt-1">维修进度与技师安排</div>
        </Link>
      </div>
    </div>
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
            <Route path="/user-center" element={<UserCenter />} />
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
