import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  Truck,
  LayoutDashboard,
  Package,
  Route,
  GitMerge,
  MapPin,
  FileText,
  Star,
  BarChart3,
  Settings,
  ChevronLeft,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { cn } from '@/lib/utils'

const navItems = [
  { label: '工作台', icon: LayoutDashboard, path: '/' },
  { label: '货源管理', icon: Package, path: '/cargo' },
  { label: '车源管理', icon: Truck, path: '/vehicle' },
  { label: '专线资源', icon: Route, path: '/route' },
  { label: '智能匹配', icon: GitMerge, path: '/matching' },
  { label: '运输跟踪', icon: MapPin, path: '/tracking' },
  { label: '合同管理', icon: FileText, path: '/contract' },
  { label: '信用评价', icon: Star, path: '/credit' },
  { label: '数据看板', icon: BarChart3, path: '/dashboard' },
  { label: '系统管理', icon: Settings, path: '/admin', adminOnly: true },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const sidebarWidth = collapsed ? 'w-16' : 'w-64'
  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  )

  const pageTitle = navItems.find((item) => isActive(item.path))?.label ?? '工作台'

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={cn(
          'flex h-full flex-col bg-[#1B2A4A] text-white transition-all duration-300',
          sidebarWidth
        )}
      >
        <div className="flex h-16 items-center gap-2 px-4">
          <Truck className="h-7 w-7 shrink-0 text-[#E8722A]" />
          {!collapsed && (
            <span className="whitespace-nowrap text-lg font-bold tracking-wide">
              物流协同中枢
            </span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {visibleNavItems.map((item) => {
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 transition-colors',
                  active
                    ? 'bg-[#E8722A] text-white'
                    : 'text-gray-300 hover:bg-[#243656] hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <span className="whitespace-nowrap text-sm">{item.label}</span>
                )}
              </Link>
            )
          })}
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-12 items-center justify-center border-t border-[#2D3F5E] text-gray-400 transition-colors hover:text-white"
        >
          <ChevronLeft
            className={cn(
              'h-5 w-5 transition-transform duration-300',
              collapsed && 'rotate-180'
            )}
          />
        </button>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
          <h1 className="text-lg font-semibold text-[#1B2A4A]">{pageTitle}</h1>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B2A4A] text-sm font-semibold text-white">
              {user?.real_name?.charAt(0) ?? 'U'}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium text-[#1B2A4A]">
                {user?.real_name ?? '用户'}
              </span>
              <span className="text-xs text-gray-400">
                {user?.role ?? ''}
              </span>
            </div>
            <button
              onClick={logout}
              className="ml-2 flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#E8722A]"
            >
              <LogOut className="h-4 w-4" />
              <span>退出</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#F5F6FA] p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
