import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAppStore } from '@/store/useAppStore'

const MainLayout: React.FC = () => {
  const { sidebarOpen } = useAppStore()

  return (
    <div className="min-h-screen bg-sf-black">
      <Sidebar />
      <Header />
      <main
        className={`pt-16 min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-16'
        }`}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default MainLayout
