import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAppStore } from '@/store'

export default function MainLayout() {
  const location = useLocation()
  const setCurrentRoute = useAppStore((s) => s.setCurrentRoute)

  useEffect(() => {
    setCurrentRoute(location.pathname)
  }, [location.pathname, setCurrentRoute])

  return (
    <div className="h-screen w-screen flex bg-slate2-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 min-h-0">
          <div className="min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
