import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAppStore } from '../../store/app'

export function AppLayout() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-logistics-bg">
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1800px] p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
