import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import MainLayout from '@/components/MainLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Customers from '@/pages/Customers'
import Products from '@/pages/Products'
import Stores from '@/pages/Stores'
import QRCode from '@/pages/QRCode'
import Share from '@/pages/Share'
import Exams from '@/pages/Exams'
import Ranking from '@/pages/Ranking'
import Compliance from '@/pages/Compliance'
import Analytics from '@/pages/Analytics'
import PlaceholderPage from '@/pages/Placeholder'
import { useAuthStore } from '@/store/auth'

function RootRedirect() {
  const { isAuthenticated } = useAuthStore()
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/qrcode" element={<QRCode />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/share" element={<Share />} />
          <Route path="/products" element={<Products />} />
          <Route path="/stores" element={<Stores />} />
          <Route path="/appointments" element={<Stores />} />
          <Route path="/services" element={<Stores />} />
          <Route path="/reviews" element={<Stores />} />
          <Route path="/inventory" element={<Products />} />
          <Route path="/promotions" element={<Products />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/training" element={<Exams />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route
            path="/teams"
            element={
              <PlaceholderPage
                title="团队管理"
                description="总部视角的团队层级穿透管理、人员档案与业绩考核"
                icon="👥"
              />
            }
          />
        </Route>

        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h1 className="text-3xl font-bold text-slate-800">404</h1>
                <p className="mt-2 text-slate-500">页面不存在</p>
                <button
                  onClick={() => (window.location.href = '/')}
                  className="mt-6 px-5 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition"
                >
                  返回首页
                </button>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  )
}
