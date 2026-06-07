import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Package,
  Store,
  Map,
  Radio,
  Wallet,
  BarChart3,
  Shield,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { useAppStore } from '@/stores/appStore'

const navItems = [
  { path: '/', label: '工作台', icon: LayoutDashboard },
  { path: '/profile', label: '个人中心', icon: Users },
  { path: '/orders', label: '搜索筛选订单', icon: Package },
  { path: '/riders', label: '骑手管理', icon: Users },
  { path: '/merchants', label: '商户管理', icon: Store },
  { path: '/dispatch', label: '区域调度', icon: Map },
  { path: '/tracking', label: '轨迹与告警', icon: Radio },
  { path: '/settlement', label: '收入结算', icon: Wallet },
  { path: '/admin', label: '管理后台', icon: BarChart3 },
  { path: '/dashboard/ops', label: '运营看板', icon: BarChart3 },
  { path: '/risk', label: '风控策略', icon: Shield },
]

const breadcrumbMap: Record<string, string> = {
  '/': '工作台',
  '/profile': '个人中心',
  '/riders': '骑手管理',
  '/orders': '订单管理',
  '/merchants': '商户管理',
  '/dispatch': '区域调度',
  '/tracking': '轨迹与告警',
  '/settlement': '收入结算',
  '/admin': '管理后台',
  '/dashboard/ops': '运营看板',
  '/risk': '风控策略',
}

const detailBreadcrumbMap: Record<string, { parent: string; label: string }> = {
  '/riders/': { parent: '/riders', label: '骑手详情' },
  '/orders/create': { parent: '/orders', label: '创建订单' },
  '/orders/': { parent: '/orders', label: '订单详情' },
  '/merchants/': { parent: '/merchants', label: '商户详情' },
}

function isNumericId(part: string): boolean {
  return /^\d+$/.test(part)
}

function getBreadcrumbs(pathname: string) {
  const crumbs: { label: string; path: string }[] = []

  if (pathname === '/') {
    return [{ label: '工作台', path: '/' }]
  }

  if (pathname === '/orders/create') {
    const detail = detailBreadcrumbMap['/orders/create']
    crumbs.push({ label: breadcrumbMap[detail.parent] || '订单管理', path: detail.parent })
    crumbs.push({ label: detail.label, path: pathname })
    return crumbs
  }

  for (const [prefix, config] of Object.entries(detailBreadcrumbMap)) {
    if (prefix === '/orders/create') continue
    if (pathname.startsWith(prefix) && pathname.length > prefix.length) {
      const remaining = pathname.slice(prefix.length)
      if (isNumericId(remaining)) {
        crumbs.push({ label: breadcrumbMap[config.parent] || config.parent, path: config.parent })
        crumbs.push({ label: config.label, path: pathname })
        return crumbs
      }
    }
  }

  const parts = pathname.split('/').filter(Boolean)
  let currentPath = ''
  for (const part of parts) {
    currentPath += `/${part}`
    const label = breadcrumbMap[currentPath] || part
    crumbs.push({ label, path: currentPath })
  }
  if (crumbs.length === 0) {
    crumbs.push({ label: '工作台', path: '/' })
  }
  return crumbs
}

function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts)
  const removeToast = useAppStore((s) => s.removeToast)
  if (toasts.length === 0) return null
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm flex items-center gap-2 min-w-[260px] animate-[slideIn_0.3s_ease] ${
            t.type === 'success' ? 'bg-emerald-500' : t.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
          }`}
        >
          <span className="flex-1">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="hover:opacity-80">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

export default function Layout() {
  const { sidebarCollapsed, toggleSidebar, currentUser } = useAppStore()
  const location = useLocation()
  const breadcrumbs = getBreadcrumbs(location.pathname)

  return (
    <div className="flex h-screen overflow-hidden bg-[#F1F5F9]">
      <aside
        className={`${
          sidebarCollapsed ? 'w-[64px]' : 'w-[240px]'
        } bg-[#0F172A] flex flex-col transition-all duration-300 flex-shrink-0`}
      >
        <div className="h-[60px] flex items-center px-4 border-b border-white/10">
          {!sidebarCollapsed && (
            <span className="text-white font-bold text-base truncate">骑手协同调度</span>
          )}
          <button onClick={toggleSidebar} className="text-white/70 hover:text-white ml-auto">
            {sidebarCollapsed ? <Menu size={20} /> : <X size={18} />}
          </button>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                  isActive
                    ? 'bg-[#FF6B35] text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm truncate">{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-white/10">
            <div className="text-white/40 text-xs">v1.0.0</div>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-[60px] bg-white border-b border-gray-200 flex items-center px-6 flex-shrink-0">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={14} />}
                <span className={i === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : ''}>
                  {crumb.label}
                </span>
              </span>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-gray-600">{currentUser.name}</span>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {currentUser.role}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}
