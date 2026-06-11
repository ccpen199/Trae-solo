import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import { useAuthStore } from '@/store/useAuthStore'

export default function MainLayout() {
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()

  const isHome = location.pathname === '/'
  const showSidebar = isAuthenticated && !isHome

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="flex">
        <AnimatePresence mode="wait">
          {showSidebar && (
            <motion.aside
              key="sidebar"
              initial={{ x: -256, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -256, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed left-0 top-16 z-30"
            >
              <Sidebar />
            </motion.aside>
          )}
        </AnimatePresence>
        <motion.main
          key="main"
          animate={{
            marginLeft: showSidebar ? 256 : 0,
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={cn('flex-1 min-h-[calc(100vh-4rem)]')}
        >
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="p-6"
          >
            <Outlet />
          </motion.div>
        </motion.main>
      </div>
    </div>
  )
}
