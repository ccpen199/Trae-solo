import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { UserHome } from './pages/UserHome'
import { UserTasks } from './pages/UserTasks'
import { Profile } from './pages/Profile'
import { TechHall } from './pages/TechHall'
import { TechTasks } from './pages/TechTasks'
import { TechProfile } from './pages/TechProfile'
import { ServiceReportView } from './pages/ServiceReportView'
import { useAppStore } from './store'
import { Loader2 } from 'lucide-react'

function App() {
  const { initApp, isInitialized, currentUser } = useAppStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      await initApp()
      setLoading(false)
    }
    init()
  }, [initApp])

  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">正在加载去中心化维修服务平台...</p>
        </div>
      </div>
    )
  }

  const isTechnician = currentUser?.role === 'technician'

  return (
    <Layout>
      <Routes>
        <Route path="/" element={isTechnician ? <Navigate to="/tech" replace /> : <UserHome />} />
        <Route path="/my-tasks" element={<UserTasks />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/report/:id" element={<ServiceReportView />} />

        <Route path="/tech" element={isTechnician ? <TechHall /> : <Navigate to="/" replace />} />
        <Route path="/tech/tasks" element={isTechnician ? <TechTasks /> : <Navigate to="/" replace />} />
        <Route path="/tech/profile" element={isTechnician ? <TechProfile /> : <Navigate to="/" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
