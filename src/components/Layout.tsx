import { Outlet, Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'
import {
  Home,
  Stethoscope,
  CalendarClock,
  Recycle,
  Users,
  BarChart3,
  Package,
  MessageSquareWarning,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'

const adminNavItems = [
  { label: '首页', icon: Home, path: '/admin' },
  { label: '智能诊断', icon: Stethoscope, path: '/diagnosis' },
  { label: '预约调度', icon: CalendarClock, path: '/booking' },
  { label: '回收估价', icon: Recycle, path: '/recycle' },
  { label: '技师管理', icon: Users, path: '/admin/technicians' },
  { label: 'SLA看板', icon: BarChart3, path: '/admin/sla' },
  { label: '配件库存', icon: Package, path: '/admin/inventory' },
  { label: '投诉处理', icon: MessageSquareWarning, path: '/admin/complaints' },
]

const consumerNavItems = [
  { label: '首页', path: '/' },
  { label: '智能诊断', path: '/diagnosis' },
  { label: '预约维修', path: '/booking' },
  { label: '订单查询', path: '/order/1' },
  { label: '设备回收', path: '/recycle' },
]

function AdminSidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const location = useLocation()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col bg-primary transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-56',
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <Wrench className="h-6 w-6 text-accent" />
            <span className="font-title text-lg font-bold text-white">终端快修</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1 text-gray-400 hover:bg-surface hover:text-white"
        >
          {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {adminNavItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-gray-400 hover:bg-surface hover:text-white',
                sidebarCollapsed && 'justify-center px-2',
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-surface p-4">
        <div className={cn('flex items-center gap-3', sidebarCollapsed && 'justify-center')}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent">
            管
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium text-white">管理员</p>
              <p className="truncate text-xs text-gray-400">admin@repair.com</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

function ConsumerNav() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Wrench className="h-6 w-6 text-accent" />
          <span className="font-title text-lg font-bold text-primary">终端快修</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {consumerNavItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary',
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-50 md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-2 md:hidden">
          {consumerNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}

function AdminLayout() {
  const { sidebarCollapsed } = useAppStore()

  return (
    <div className="min-h-screen bg-primary">
      <AdminSidebar />
      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-56',
        )}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function ConsumerLayout() {
  return (
    <div className="min-h-screen bg-surface-light">
      <ConsumerNav />
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default function Layout() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  return isAdmin ? <AdminLayout /> : <ConsumerLayout />
}
