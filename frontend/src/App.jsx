import { Component, Suspense } from 'react'
import { ConfigProvider, Spin, Result, Button } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import AdminLayout from './layouts/AdminLayout'

import Home from './pages/Home'
import Category from './pages/Category'
import Search from './pages/Search'
import Detail from './pages/Detail'
import RentConfirm from './pages/RentConfirm'
import Login from './pages/Login'
import Register from './pages/Register'
import Rentals from './pages/Rentals'
import RentalDetail from './pages/RentalDetail'
import Favorites from './pages/Favorites'
import Deposit from './pages/Deposit'
import Verify from './pages/Verify'
import Profile from './pages/Profile'
import Settings from './pages/Settings'

import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminRentals from './pages/admin/Rentals'
import AdminAppliances from './pages/admin/Appliances'

import useUserStore from './store/user'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 50, textAlign: 'center' }}>
          <Result
            status="error"
            title="加载失败"
            subTitle={this.state.error?.message || '页面发生错误'}
            extra={
              <Button type="primary" onClick={() => window.location.reload()}>
                点击重试
              </Button>
            }
          />
        </div>
      )
    }

    return this.props.children
  }
}

const ProtectedRoute = ({ children, needVerify = false }) => {
  const { user, token } = useUserStore()
  
  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (needVerify && user.is_verified !== 1) {
    return <Navigate to="/settings/verify" replace />
  }

  return children
}

const AdminRoute = ({ children }) => {
  const { admin, adminToken } = useUserStore()
  
  if (!adminToken || !admin) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

const App = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <ErrorBoundary>
        <BrowserRouter>
          <Suspense fallback={<div style={{ padding: 100, textAlign: 'center' }}><Spin size="large" /></div>}>
            <Routes>
              <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
              <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />
              <Route path="/admin/login" element={<AdminLogin />} />

              <Route path="/" element={<MainLayout><Home /></MainLayout>} />
              <Route path="/category" element={<MainLayout><Category /></MainLayout>} />
              <Route path="/category/:id" element={<MainLayout><Category /></MainLayout>} />
              <Route path="/search" element={<MainLayout><Search /></MainLayout>} />
              <Route path="/detail/:id" element={<MainLayout><Detail /></MainLayout>} />
              
              <Route path="/rent/confirm/:id" element={
                <ProtectedRoute>
                  <MainLayout><RentConfirm /></MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/rentals" element={
                <ProtectedRoute>
                  <MainLayout><Rentals /></MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/rentals/:id" element={
                <ProtectedRoute>
                  <MainLayout><RentalDetail /></MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/favorites" element={
                <ProtectedRoute>
                  <MainLayout><Favorites /></MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute>
                  <MainLayout><Settings /></MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/settings/profile" element={
                <ProtectedRoute>
                  <MainLayout><Profile /></MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/settings/verify" element={
                <ProtectedRoute>
                  <MainLayout><Verify /></MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/settings/deposit" element={
                <ProtectedRoute>
                  <MainLayout><Deposit /></MainLayout>
                </ProtectedRoute>
              } />

              <Route path="/admin" element={
                <AdminRoute>
                  <AdminLayout><AdminDashboard /></AdminLayout>
                </AdminRoute>
              } />
              
              <Route path="/admin/users" element={
                <AdminRoute>
                  <AdminLayout><AdminUsers /></AdminLayout>
                </AdminRoute>
              } />
              
              <Route path="/admin/rentals" element={
                <AdminRoute>
                  <AdminLayout><AdminRentals /></AdminLayout>
                </AdminRoute>
              } />
              
              <Route path="/admin/appliances" element={
                <AdminRoute>
                  <AdminLayout><AdminAppliances /></AdminLayout>
                </AdminRoute>
              } />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ErrorBoundary>
    </ConfigProvider>
  )
}

export default App
