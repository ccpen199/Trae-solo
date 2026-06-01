import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import SchemeList from '@/pages/SchemeList'
import SchemeDetail from '@/pages/SchemeDetail'
import Retrospective from '@/pages/Retrospective'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  const { init } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    init()
    setReady(true)
  }, [init])

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center">
        <div className="text-[#1e3a5f] flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
          加载中...
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="/schemes" element={<SchemeList />} />
          <Route path="/schemes/:id" element={<SchemeDetail />} />
          <Route path="/retrospective" element={<Retrospective />} />
        </Route>
      </Routes>
    </Router>
  )
}
