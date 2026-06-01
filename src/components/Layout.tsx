import { useState } from 'react'
import { Outlet, NavLink, Navigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  UtensilsCrossed,
  AlertTriangle,
  Search,
  Truck,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'

type Role = 'canteen_admin' | 'logistics' | 'parent' | 'regulator'

const roleNavItems: Record<Role, { to: string; label: string; icon: any }[]> = {
  canteen_admin: [
    { to: '/', label: '工作台', icon: LayoutDashboard },
    { to: '/procurements', label: '食材采购', icon: ShoppingCart },
    { to: '/inventory', label: '入库与领用', icon: Package },
    { to: '/menus', label: '每日菜单', icon: UtensilsCrossed },
    { to: '/anomalies', label: '异常处理', icon: AlertTriangle },
  ],
  logistics: [
    { to: '/', label: '工作台', icon: LayoutDashboard },
    { to: '/procurements', label: '食材采购', icon: ShoppingCart },
    { to: '/menus', label: '每日菜单', icon: UtensilsCrossed },
    { to: '/suppliers', label: '供应商管理', icon: Truck },
    { to: '/anomalies', label: '异常处理', icon: AlertTriangle },
  ],
  parent: [
    { to: '/', label: '首页', icon: LayoutDashboard },
    { to: '/menus', label: '每日菜单', icon: UtensilsCrossed },
    { to: '/traceability', label: '溯源查询', icon: Search },
  ],
  regulator: [
    { to: '/', label: '监管工作台', icon: LayoutDashboard },
    { to: '/procurements', label: '采购记录', icon: ShoppingCart },
    { to: '/menus', label: '菜单留样', icon: UtensilsCrossed },
    { to: '/anomalies', label: '异常整改', icon: AlertTriangle },
    { to: '/traceability', label: '溯源查询', icon: Search },
    { to: '/suppliers', label: '供应商', icon: Truck },
  ],
}

const roleLabels: Record<Role, string> = {
  canteen_admin: '食堂管理员',
  logistics: '学校后勤',
  parent: '学生家长',
  regulator: '监管人员',
}

const roleAllowedPaths: Record<Role, string[]> = {
  canteen_admin: ['/', '/procurements', '/inventory', '/menus', '/anomalies'],
  logistics: ['/', '/procurements', '/menus', '/suppliers', '/anomalies'],
  parent: ['/', '/menus', '/traceability'],
  regulator: ['/', '/procurements', '/menus', '/anomalies', '/traceability', '/suppliers'],
}

export default function Layout() {
  const { user, token, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  const role = (user?.role as Role) || 'canteen_admin'
  const navItems = roleNavItems[role] || roleNavItems.canteen_admin
  const allowedPaths = roleAllowedPaths[role] || roleAllowedPaths.canteen_admin

  if (!allowedPaths.includes(location.pathname)) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-[#1e3a5f] text-white transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center justify-between px-4 lg:justify-center">
          <span className="text-lg font-bold">食安溯源</span>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="mb-2 rounded-md bg-white/10 px-3 py-2">
            <p className="text-xs text-white/60">当前角色</p>
            <p className="text-sm font-medium">{roleLabels[role] || '用户'}</p>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between bg-white px-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} className="text-gray-600" />
            </button>
            <h1 className="text-base font-semibold text-gray-800">
              智慧校园食安溯源系统
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {user?.name || user?.username || ''}
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <LogOut size={16} />
              退出
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
