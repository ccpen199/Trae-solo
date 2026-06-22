import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { ConfigProvider, Spin, message } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import type { UserRole, User, Worker, Enterprise } from './types'
import { tokenUtils } from './utils/request'
import Login from './pages/Login'
import Register from './pages/Register'
import WorkerLayout from './layouts/WorkerLayout'
import EnterpriseLayout from './layouts/EnterpriseLayout'
import AdminLayout from './layouts/AdminLayout'
import authApi from './api/auth'

interface AuthContextType {
  user: User | null
  worker: Worker | null
  enterprise: Enterprise | null
  loading: boolean
  refreshUser: () => Promise<void>
  loginSuccess: (user: User, worker?: Worker | null, enterprise?: Enterprise | null) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

function AuthRoute({ allowedRoles }: { allowedRoles?: UserRole[] }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectMap: Record<UserRole, string> = {
      worker: '/worker/dashboard',
      enterprise: '/enterprise/dashboard',
      admin: '/admin/dashboard',
    }
    return <Navigate to={redirectMap[user.role]} replace />
  }

  return <Outlet />
}

function HomeRedirect() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const redirectMap: Record<UserRole, string> = {
    worker: '/worker/dashboard',
    enterprise: '/enterprise/dashboard',
    admin: '/admin/dashboard',
  }
  return <Navigate to={redirectMap[user.role] || '/login'} replace />
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => tokenUtils.getUserInfo())
  const [worker, setWorker] = useState<Worker | null>(() => tokenUtils.getWorkerInfo())
  const [enterprise, setEnterprise] = useState<Enterprise | null>(() => tokenUtils.getEnterpriseInfo())
  const [loading, setLoading] = useState(!tokenUtils.getToken())

  const refreshUser = useCallback(async () => {
    const token = tokenUtils.getToken()
    if (!token) {
      setUser(null)
      setWorker(null)
      setEnterprise(null)
      setLoading(false)
      return
    }

    try {
      const res = await authApi.getMe()
      if (res.code === 0 && res.data) {
        setUser(res.data.user || null)
        setWorker(res.data.worker || null)
        setEnterprise(res.data.enterprise || null)
        if (res.data.user) tokenUtils.setUserInfo(res.data.user)
        if (res.data.worker) tokenUtils.setWorkerInfo(res.data.worker)
        if (res.data.enterprise) tokenUtils.setEnterpriseInfo(res.data.enterprise)
      } else {
        tokenUtils.clearAll()
        setUser(null)
        setWorker(null)
        setEnterprise(null)
      }
    } catch {
      const cached = tokenUtils.getUserInfo()
      if (!cached) {
        tokenUtils.clearAll()
        setUser(null)
        setWorker(null)
        setEnterprise(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const loginSuccess = useCallback((u: User, w?: Worker | null, e?: Enterprise | null) => {
    setUser(u)
    setWorker(w || null)
    setEnterprise(e || null)
    setLoading(false)
  }, [])

  const logout = useCallback(() => {
    tokenUtils.clearAll()
    setUser(null)
    setWorker(null)
    setEnterprise(null)
  }, [])

  useEffect(() => {
    if (tokenUtils.getToken()) {
      void refreshUser()
    }
  }, [refreshUser])

  return (
    <AuthContext.Provider value={{ user, worker, enterprise, loading, refreshUser, loginSuccess, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<HomeRedirect />} />

            <Route element={<AuthRoute allowedRoles={['worker']} />}>
              <Route path="/worker/*" element={<WorkerLayout />} />
            </Route>

            <Route element={<AuthRoute allowedRoles={['enterprise']} />}>
              <Route path="/enterprise/*" element={<EnterpriseLayout />} />
            </Route>

            <Route element={<AuthRoute allowedRoles={['admin']} />}>
              <Route path="/admin/*" element={<AdminLayout />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
