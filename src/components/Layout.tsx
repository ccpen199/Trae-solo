import { Outlet } from 'react-router-dom'
import { User } from 'lucide-react'
import { useStore } from '@/store'
import Sidebar from '@/components/Sidebar'
import CitySwitcher from '@/components/CitySwitcher'
import Marquee from '@/components/Marquee'

export default function Layout() {
  const collapsed = useStore((s) => s.sidebarCollapsed)
  const sidebarWidth = collapsed ? 72 : 240

  return (
    <div className="min-h-screen bg-wudu-950">
      <Sidebar />

      <div
        className="transition-all duration-250 ease-in-out"
        style={{ marginLeft: sidebarWidth }}
      >
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-6 bg-wudu-950/80 backdrop-blur-md border-b border-wudu-700/50">
          <CitySwitcher />
          <div className="w-8 h-8 rounded-full bg-wudu-700 flex items-center justify-center">
            <User size={16} className="text-wudu-300" />
          </div>
        </header>

        <Marquee />

        <main className="p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
