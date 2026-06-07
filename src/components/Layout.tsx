import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  MapPin,
  TrendingUp,
  Zap,
  Package,
  Truck,
  Eye,
  Wallet,
  Shield,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
  User,
  AlertTriangle,
  ShieldCheck,
  CreditCard,
  BarChart3,
  ChevronDown,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

interface NavItem {
  label: string
  icon: React.ElementType
  path: string
  children?: { label: string; icon: React.ElementType; path: string }[]
}

const navItems: NavItem[] = [
  { label: '仪表盘', icon: LayoutDashboard, path: '/dashboard' },
  { label: '运力池', icon: MapPin, path: '/capacity' },
  { label: '运价中心', icon: TrendingUp, path: '/pricing' },
  { label: '智能撮合', icon: Zap, path: '/matching' },
  { label: '货源管理', icon: Package, path: '/cargo' },
  { label: '司机工作台', icon: Truck, path: '/driver' },
  { label: '全程监控', icon: Eye, path: '/monitoring' },
  { label: '结算中心', icon: Wallet, path: '/settlement' },
  {
    label: '运营后台',
    icon: Shield,
    path: '/admin',
    children: [
      { label: '供需预警', icon: AlertTriangle, path: '/admin/warning' },
      { label: '风控管理', icon: ShieldCheck, path: '/admin/risk' },
      { label: '授信管理', icon: CreditCard, path: '/admin/credit' },
      { label: '预测看板', icon: BarChart3, path: '/admin/forecast' },
    ],
  },
]

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null)

  useEffect(() => {
    const adminMatch = location.pathname.startsWith('/admin')
    if (adminMatch) setExpandedMenu('/admin')
  }, [location.pathname])

  return (
    <aside
      className={`h-screen gradient-dark text-white flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-[200px]'
      }`}
    >
      <div className="flex items-center h-14 px-3 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-bold text-sm shrink-0">
          达
        </div>
        {!sidebarCollapsed && (
          <span className="ml-3 font-semibold text-sm whitespace-nowrap">货达通</span>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto p-1 rounded hover:bg-white/10 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.children
            ? location.pathname.startsWith(item.path)
            : location.pathname === item.path
          const isExpanded = expandedMenu === item.path

          return (
            <div key={item.path}>
              <button
                onClick={() => {
                  if (item.children) {
                    setExpandedMenu(isExpanded ? null : item.path)
                  } else {
                    navigate(item.path)
                  }
                }}
                className={`w-full flex items-center h-10 px-3 gap-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-white/15 text-accent-light'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left whitespace-nowrap">{item.label}</span>
                    {item.children && (
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    )}
                  </>
                )}
              </button>

              {item.children && isExpanded && !sidebarCollapsed && (
                <div className="ml-4">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon
                    const childActive = location.pathname === child.path
                    return (
                      <button
                        key={child.path}
                        onClick={() => navigate(child.path)}
                        className={`w-full flex items-center h-9 px-3 gap-2 text-xs transition-colors ${
                          childActive
                            ? 'text-accent-light bg-white/10'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <ChildIcon size={14} />
                        <span>{child.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

function TopBar() {
  const { user, logout } = useAuthStore()
  const { notifications } = useAppStore()
  const navigate = useNavigate()
  const unread = notifications.filter((n) => !n.read).length

  return (
    <header className="h-14 bg-white border-b border-border flex items-center px-6 gap-4">
      <div className="flex-1" />
      <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <Bell size={18} className="text-secondary" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-coral text-white text-[10px] rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      <div className="flex items-center gap-2 pl-4 border-l border-border">
        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
          <User size={14} className="text-white" />
        </div>
        <div className="text-sm">
          <span className="font-medium text-primary">{user?.name || '用户'}</span>
          <span className="ml-2 text-xs text-muted">
            {user?.role === 'shipper' ? '货主' : user?.role === 'driver' ? '司机' : '管理员'}
          </span>
        </div>
        <button
          onClick={() => {
            logout()
            navigate('/login')
          }}
          className="ml-2 p-1.5 rounded hover:bg-gray-100 transition-colors"
          title="退出登录"
        >
          <LogOut size={16} className="text-muted" />
        </button>
      </div>
    </header>
  )
}

export default function Layout() {
  const { isAuthenticated, loadFromStorage, login } = useAuthStore()
  const navigate = useNavigate()
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    loadFromStorage()
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (storedToken && storedUser) {
      setAuthReady(true)
      return
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    let cancelled = false
    login('13800000001', 'admin123', 'admin')
      .catch(() => {
        if (!cancelled) navigate('/login')
      })
      .finally(() => {
        if (!cancelled) setAuthReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [loadFromStorage, login, navigate])

  useEffect(() => {
    if (authReady && !isAuthenticated && !localStorage.getItem('token')) {
      navigate('/login')
    }
  }, [authReady, isAuthenticated, navigate])

  if (!authReady || !isAuthenticated) return null

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto bg-surface p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
