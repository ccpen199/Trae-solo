import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import TopNavbar from './TopNavbar'
import Sidebar from './Sidebar'
import MobileTabBar from './MobileTabBar'
import { useUserStore } from '@/store/user'
import { cn } from '@/lib/utils'

export default function Layout() {
  const elderlyMode = useUserStore((state) => state.elderlyMode)

  useEffect(() => {
    const root = document.documentElement
    if (elderlyMode) {
      root.classList.add('elderly-mode')
    } else {
      root.classList.remove('elderly-mode')
    }
  }, [elderlyMode])

  return (
    <div className={cn('min-h-screen bg-gray-50', elderlyMode && 'elderly-mode')}>
      <TopNavbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-w-0 pb-16 md:pb-0">
          <div className="p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileTabBar />
    </div>
  )
}
