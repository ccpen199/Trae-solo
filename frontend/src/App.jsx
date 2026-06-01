import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import LinenItems from './pages/LinenItems'
import Distributions from './pages/Distributions'
import Collections from './pages/Collections'
import Washing from './pages/Washing'
import DamageReports from './pages/DamageReports'
import DamageApproval from './pages/DamageApproval'
import Settlements from './pages/Settlements'
import Suppliers from './pages/Suppliers'
import './App.css'

function ProtectedRoute({ children, permission }) {
  const { user, hasPermission } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/" replace />
  }
  return children
}

function App() {
  const { user } = useAuth()

  return (
    <BrowserRouter>
      {!user ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/linen-items" element={<LinenItems />} />
            <Route path="/distributions" element={<Distributions />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/washing" element={<Washing />} />
            <Route path="/damage-reports" element={
              <ProtectedRoute permission="report_damage">
                <DamageReports />
              </ProtectedRoute>
            } />
            <Route path="/damage-approval" element={
              <ProtectedRoute permission="approve_damage">
                <DamageApproval />
              </ProtectedRoute>
            } />
            <Route path="/settlements" element={<Settlements />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      )}
    </BrowserRouter>
  )
}

export default App
