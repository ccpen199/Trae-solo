import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Box, Factory, Wrench, CheckSquare } from 'lucide-react'

const navItems = [
  { path: '/', label: '统计看板', icon: LayoutDashboard },
  { path: '/molds', label: '模具档案', icon: Box },
  { path: '/production', label: '生产领用', icon: Factory },
  { path: '/maintenance', label: '维修保养', icon: Wrench },
  { path: '/quality', label: '质量记录', icon: CheckSquare },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="w-64 bg-slate-800 min-h-screen text-white">
          <div className="p-6">
            <h1 className="text-xl font-bold text-white">模具管理系统</h1>
            <p className="text-slate-400 text-sm mt-1">Mold Management System</p>
          </div>
          <nav className="mt-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-6 py-3 text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white border-r-4 border-blue-400'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
