import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  ShieldAlert,
  Tags,
  BarChart3,
  Building2,
  Users,
  ChevronRight,
} from 'lucide-react'
import { useStore } from '@/store'

const adminNavItems = [
  { path: '/admin', label: '管理概览', icon: Building2, end: true },
  { path: '/admin/risk-control', label: '风控引擎', icon: ShieldAlert },
  { path: '/admin/policy-tags', label: '政策标签', icon: Tags },
  { path: '/admin/efficiency', label: '效能监测', icon: BarChart3 },
  { path: '/admin/users', label: '用户管理', icon: Users },
]

const breadcrumbMap: Record<string, string> = {
  '/admin': '管理概览',
  '/admin/risk-control': '风控引擎',
  '/admin/policy-tags': '政策标签',
  '/admin/efficiency': '效能监测',
  '/admin/users': '用户管理',
}

export default function AdminLayout() {
  const location = useLocation()
  const { user } = useStore()

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex-shrink-0 w-60 flex flex-col" style={{ backgroundColor: '#1D2129' }}>
        <div className="flex items-center h-16 px-5 border-b border-white/10">
          <span className="text-white font-semibold text-lg truncate">管理后台</span>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {adminNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 transition-colors ${
                  isActive
                    ? 'bg-primary text-white font-medium'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`
              }
            >
              <item.icon size={20} className="flex-shrink-0" />
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-white text-sm">{user?.name?.[0] || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{user?.name || '管理员'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.role || '系统管理员'}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center h-14 px-6 bg-white border-b flex-shrink-0">
          <nav className="flex items-center gap-1 text-sm">
            <NavLink to="/" className="text-gray-400 hover:text-gray-600">首页</NavLink>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-gray-900 font-medium">
              {breadcrumbMap[location.pathname] || '管理后台'}
            </span>
          </nav>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-xl p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
