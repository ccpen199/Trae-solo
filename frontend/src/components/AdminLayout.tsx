import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, CheckSquare, Hash, Flame, ShieldAlert, BarChart3, Users } from 'lucide-react'

const menuItems = [
  { path: '/admin', label: '仪表盘', icon: LayoutDashboard, exact: true },
  { path: '/admin/contents', label: '内容管理', icon: FileText },
  { path: '/admin/review', label: '审核管理', icon: CheckSquare },
  { path: '/admin/topics', label: '话题管理', icon: Hash },
  { path: '/admin/hotlist', label: '热门管理', icon: Flame },
  { path: '/admin/sensitive', label: '敏感词管理', icon: ShieldAlert },
  { path: '/admin/analytics', label: '数据分析', icon: BarChart3 },
  { path: '/admin/users', label: '用户管理', icon: Users },
]

export default function AdminLayout() {
  const location = useLocation()

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-56 bg-white border-r border-gray-200 shrink-0">
        <div className="p-4 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">城</span>
            </div>
            <span className="text-lg font-bold text-gray-900">城事志</span>
          </Link>
          <p className="text-xs text-gray-400 mt-1">管理后台</p>
        </div>
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path, item.exact)
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
