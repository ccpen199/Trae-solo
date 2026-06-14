import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Home,
  PackageSearch,
  ClipboardList,
  Receipt,
  Wallet,
  ShieldCheck,
  UserCheck,
  User,
  Menu,
  X,
  Wifi,
  WifiOff,
  RefreshCw,
  Truck,
} from 'lucide-react'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/freight', label: '货源大厅', icon: PackageSearch },
  { path: '/orders', label: '运单中心', icon: ClipboardList },
  { path: '/invoices', label: '发票管理', icon: Receipt },
  { path: '/settlement', label: '结算中心', icon: Wallet },
  { path: '/safety', label: '安全台账', icon: ShieldCheck },
  { path: '/certification', label: '实名认证', icon: UserCheck },
  { path: '/profile', label: '个人中心', icon: User },
]

export default function Layout() {
  const { user } = useAuthStore()
  const { sidebarOpen, onlineStatus, syncing, toggleSidebar, setOnlineStatus } = useAppStore()
  const location = useLocation()

  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true)
    const handleOffline = () => setOnlineStatus(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnlineStatus])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        toggleSidebar()
      }
    }
    if (window.innerWidth < 768) {
      toggleSidebar()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col fixed inset-y-0 left-0 z-30 bg-navy-500 text-white transition-all duration-300',
          sidebarOpen ? 'w-60' : 'w-16'
        )}
      >
        <div className="flex items-center h-16 px-4 border-b border-navy-400">
          <Truck className="h-7 w-7 text-amber-400 flex-shrink-0" />
          {sidebarOpen && (
            <span className="ml-3 text-xl font-bold text-amber-400 whitespace-nowrap">
              运税通
            </span>
          )}
        </div>

        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-navy-400 text-amber-400 border-r-3 border-amber-400'
                    : 'text-navy-100 hover:bg-navy-400 hover:text-white'
                )}
              >
                <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-amber-400')} />
                {sidebarOpen && <span className="ml-3">{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        <div className="p-4 border-t border-navy-400">
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center w-full p-2 rounded-lg hover:bg-navy-400 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={toggleSidebar} />
          <aside className="absolute left-0 inset-y-0 w-60 bg-navy-500 text-white flex flex-col">
            <div className="flex items-center justify-between h-16 px-4 border-b border-navy-400">
              <div className="flex items-center">
                <Truck className="h-7 w-7 text-amber-400" />
                <span className="ml-3 text-xl font-bold text-amber-400">运税通</span>
              </div>
              <button onClick={toggleSidebar} className="p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive =
                  item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path)
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={toggleSidebar}
                    className={cn(
                      'flex items-center px-4 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-navy-400 text-amber-400'
                        : 'text-navy-100 hover:bg-navy-400 hover:text-white'
                    )}
                  >
                    <item.icon
                      className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-amber-400')}
                    />
                    <span className="ml-3">{item.label}</span>
                  </NavLink>
                )
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300',
          sidebarOpen ? 'md:ml-60' : 'md:ml-16'
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between h-16 bg-white border-b border-gray-200 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs">
              {onlineStatus ? (
                <Wifi className="h-4 w-4 text-mint-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-coral-500" />
              )}
              <span className={onlineStatus ? 'text-mint-600' : 'text-coral-600'}>
                {onlineStatus ? '在线' : '离线'}
              </span>
            </div>

            {syncing && (
              <RefreshCw className="h-4 w-4 text-amber-500 animate-spin" />
            )}

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-navy-100 flex items-center justify-center">
                <User className="h-4 w-4 text-navy-500" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name || '用户'}</p>
                <p className="text-xs text-gray-500">
                  {user?.role === 'driver' ? '司机' : '货主'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>

        {/* Mobile Bottom Tab Bar */}
        <nav className="md:hidden flex items-center justify-around bg-white border-t border-gray-200 py-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-2 py-1 text-xs',
                  isActive ? 'text-amber-500' : 'text-gray-400'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
