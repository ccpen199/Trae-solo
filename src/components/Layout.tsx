import { useStore } from '@/store/useStore'
import { useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  ShieldCheck,
  FileText,
  Wallet,
  Activity,
  ChevronLeft,
  ChevronRight,
  Bell,
  User,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

const navItems = [
  { path: '/', label: '首页', icon: LayoutDashboard },
  { path: '/certificates', label: '证照办理', icon: ShieldCheck },
  { path: '/services', label: '政务服务', icon: FileText },
  { path: '/life', label: '生活服务', icon: Wallet },
  { path: '/monitor', label: '运行监控', icon: Activity },
]

function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useStore()
  const location = useLocation()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col bg-gov-navy text-white transition-all duration-300',
        sidebarCollapsed ? 'w-[72px]' : 'w-[240px]'
      )}
    >
      <div className="flex h-16 items-center justify-center border-b border-white/10 px-4">
        {sidebarCollapsed ? (
          <Menu className="h-6 w-6 text-gov-gold" />
        ) : (
          <span className="font-serif text-lg tracking-wider text-gov-gold">深圳政务</span>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-200',
                isActive
                  ? 'border-l-[3px] border-gov-blue bg-gov-blue/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-2">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded-md py-2 text-white/70 transition-colors duration-200 hover:bg-white/10 hover:text-white"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>
    </aside>
  )
}

function TopBar() {
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed)
  const location = useLocation()

  const currentNav = navItems.find((item) => item.path === location.pathname)
  const breadcrumbText = currentNav ? currentNav.label : '首页'

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 transition-all duration-300',
        sidebarCollapsed ? 'left-[72px]' : 'left-[240px]'
      )}
    >
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/" className="hover:text-gov-blue">首页</Link>
        {breadcrumbText !== '首页' && (
          <>
            <span>/</span>
            <span className="text-gray-800">{breadcrumbText}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gov-red" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gov-navy text-white">
          <User className="h-4 w-4" />
        </div>
      </div>
    </header>
  )
}

export default function Layout({ children }: { children: ReactNode }) {
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed)

  return (
    <div className="min-h-screen bg-gov-slate">
      <Sidebar />
      <TopBar />
      <main
        className={cn(
          'pt-16 transition-all duration-300',
          sidebarCollapsed ? 'ml-[72px]' : 'ml-[240px]'
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
