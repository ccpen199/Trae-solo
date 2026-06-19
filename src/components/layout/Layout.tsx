import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { useAppStore } from '@/stores/appStore'

const sidebarRoutes = ['/personal', '/enterprise', '/admin']

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { sidebarCollapsed } = useAppStore()

  const showSidebar = sidebarRoutes.some((route) =>
    location.pathname.startsWith(route)
  )

  return (
    <div className="min-h-screen bg-gov-bg-light">
      <Navbar />

      <div className="pt-16 flex">
        {showSidebar && <Sidebar />}

        <motion.main
          initial={false}
          animate={{
            marginLeft: showSidebar ? (sidebarCollapsed ? 64 : 240) : 0,
          }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="flex-1 min-h-[calc(100vh-4rem)] p-6 overflow-y-auto"
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}
