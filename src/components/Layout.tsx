import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useAppStore } from '@/store/useAppStore'

export default function Layout() {
  const { fetchOverview } = useAppStore()

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />
      <main className="ml-64 pt-16 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
