import { NavLink, Outlet, useLocation, Link } from 'react-router-dom'
import { LayoutDashboard, Store, Megaphone, BarChart3, Shield, ArrowLeft } from 'lucide-react'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: '数据看板', end: true },
  { to: '/admin/merchants', icon: Store, label: '商户管理', end: false },
  { to: '/admin/campaigns', icon: Megaphone, label: '营销活动', end: false },
  { to: '/admin/reports', icon: BarChart3, label: '消费报告', end: false },
  { to: '/admin/geofence', icon: Shield, label: '地理围栏', end: false },
]

const pageTitles: Record<string, string> = {
  '/admin': '运营管理后台 · 数据看板',
  '/admin/merchants': '商户管理',
  '/admin/campaigns': '营销活动',
  '/admin/reports': '消费报告',
  '/admin/geofence': '地理围栏',
}

export default function AdminLayout() {
  const location = useLocation()
  const title = pageTitles[location.pathname] || '运营中台'

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 flex-shrink-0 bg-gray-800 text-white flex flex-col fixed h-full z-40">
        <div className="px-5 py-6 border-b border-gray-700">
          <h1 className="font-serif text-xl font-bold">松江生活</h1>
          <p className="text-xs text-gray-400 mt-1">运营管理后台</p>
        </div>

        <nav className="flex-1 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-3 text-sm transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-700 p-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回用户端
          </Link>
        </div>
      </aside>

      <div className="flex-1 ml-60">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 h-14 flex items-center">
          <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
        </header>
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
