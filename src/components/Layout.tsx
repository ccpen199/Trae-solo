import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useStore } from '@/store'
import { useEffect } from 'react'

export default function Layout() {
  const { sidebarCollapsed, realtimeUpdateEnabled, simulateRealtimeUpdate } = useStore()

  useEffect(() => {
    if (!realtimeUpdateEnabled) return
    const timer = setInterval(() => {
      simulateRealtimeUpdate()
    }, 5000)
    return () => clearInterval(timer)
  }, [realtimeUpdateEnabled, simulateRealtimeUpdate])

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-56'
        }`}
      >
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
