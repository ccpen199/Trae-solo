import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { Suspense, lazy } from 'react'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Home = lazy(() => import('./pages/Home'))
const Products = lazy(() => import('./pages/Products'))
const RiskAssessment = lazy(() => import('./pages/RiskAssessment'))
const Orders = lazy(() => import('./pages/Orders'))
const Assets = lazy(() => import('./pages/Assets'))
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminOrders = lazy(() => import('./pages/admin/Orders'))
const AdminAlerts = lazy(() => import('./pages/admin/Alerts'))
const AdminAudit = lazy(() => import('./pages/admin/Audit'))
const Layout = lazy(() => import('./components/Layout'))

function PrivateRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, token } = useAuthStore()
  
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    }>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <Layout>
              <Home />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/products" element={
          <PrivateRoute>
            <Layout>
              <Products />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/risk-assessment" element={
          <PrivateRoute>
            <Layout>
              <RiskAssessment />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/orders" element={
          <PrivateRoute>
            <Layout>
              <Orders />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/assets" element={
          <PrivateRoute>
            <Layout>
              <Assets />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/admin" element={
          <PrivateRoute roles={['admin', 'compliance', 'analyst']}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/admin/orders" element={
          <PrivateRoute roles={['admin', 'compliance', 'analyst']}>
            <Layout>
              <AdminOrders />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/admin/alerts" element={
          <PrivateRoute roles={['admin', 'compliance', 'analyst']}>
            <Layout>
              <AdminAlerts />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/admin/audit" element={
          <PrivateRoute roles={['admin', 'compliance', 'analyst']}>
            <Layout>
              <AdminAudit />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
