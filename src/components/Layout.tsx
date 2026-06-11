import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { useAppStore } from '@/store'

export default function Layout() {
  const { sidebarOpen } = useAppStore()

  return (
    <div className="min-h-screen bg-gov-bg">
      <Sidebar />
      <Header />
      <main
        className="pt-16 min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? '240px' : '64px' }}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
