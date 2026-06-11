import { Outlet, Navigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import Sidebar from './Sidebar'
import Header from './Header'

export default function MainLayout() {
  const { sidebarCollapsed, isAuthenticated } = useAppStore()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen bg-surface-primary font-sans">
      <Sidebar />
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-60'
        }`}
      >
        <Header />
        <main className="p-6 bg-surface-primary min-h-[calc(100vh-3.5rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
