import { NavLink, useLocation, Outlet } from 'react-router-dom'
import { LayoutDashboard, Receipt, TrendingUp, UserCircle, Shield, ArrowLeft, Zap } from 'lucide-react'
import { useAppStore } from '@/store'

const adminNavItems = [
  { path: '/admin', icon: LayoutDashboard, label: '运营看板' },
  { path: '/admin/settlement', icon: Receipt, label: '分账结算' },
  { path: '/admin/revenue', icon: TrendingUp, label: '收益分析' },
  { path: '/admin/user-profile', icon: UserCircle, label: '用户画像' },
  { path: '/admin/community-review', icon: Shield, label: '内容审核' },
]

export default function AdminLayout() {
  const location = useLocation()
  const { sidebarCollapsed } = useAppStore()

  return (
    <div className="flex h-screen bg-deep-blue overflow-hidden">
      <aside
        className="flex flex-col h-full bg-surface border-r border-white/5 shrink-0"
        style={{ width: sidebarCollapsed ? '64px' : '240px' }}
      >
        <div className="flex items-center h-16 px-4 border-b border-white/5">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2 animate-slide-right">
              <Zap className="w-6 h-6 text-amber-orange" />
              <span className="text-lg font-bold text-amber-orange">运营后台</span>
            </div>
          ) : (
            <Zap className="w-6 h-6 text-amber-orange mx-auto" />
          )}
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {adminNavItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={() => {
                const isActive = path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path)
                return `nav-item ${isActive ? 'nav-item-active' : ''} ${sidebarCollapsed ? 'justify-center px-2' : ''}`
              }}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!sidebarCollapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/5 py-2 px-2">
          <NavLink
            to="/"
            className={`nav-item ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
            title={sidebarCollapsed ? '返回前台' : undefined}
          >
            <ArrowLeft className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && <span>返回前台</span>}
          </NavLink>
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center h-16 px-6 bg-surface/50 backdrop-blur border-b border-white/5 shrink-0">
          <h1 className="text-lg font-semibold text-gray-100">运营管理后台</h1>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-gray-500 bg-deep-blue px-3 py-1 rounded-full">管理员模式</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
