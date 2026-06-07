import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Newspaper, Store, TrendingUp, Activity, Users } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/admin', label: '数据概览', icon: LayoutDashboard, exact: true },
  { path: '/admin/news', label: '新闻管理', icon: Newspaper, exact: false },
  { path: '/admin/merchants', label: '商户审核', icon: Store, exact: false },
  { path: '/admin/sentiment', label: '舆情监测', icon: TrendingUp, exact: false },
  { path: '/admin/activity', label: '活动看板', icon: Activity, exact: false },
  { path: '/admin/users', label: '用户管理', icon: Users, exact: false },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  const isActive = (path: string, exact: boolean) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="w-48 bg-white border-r border-gray-200 shrink-0">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">管理后台</h2>
        </div>
        <nav className="p-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive(item.path, item.exact)
                    ? 'bg-red-50 text-red-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-gray-50 overflow-auto">
        {children}
      </main>
    </div>
  )
}
