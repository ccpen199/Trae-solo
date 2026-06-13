import { Link, useLocation, Outlet } from 'react-router-dom'
import { AlertTriangle, Map, BookOpen, BarChart3, Package, ChevronLeft, Menu, X } from 'lucide-react'
import { useState } from 'react'

const adminNavItems = [
  { path: '/admin/alerts', label: '异常预警', icon: AlertTriangle },
  { path: '/admin/networks', label: '网点围栏', icon: Map },
  { path: '/admin/knowledge', label: '知识库', icon: BookOpen },
  { path: '/admin/profiling', label: '行为画像', icon: BarChart3 },
]

export default function AdminLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface flex">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-navy transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-white text-lg font-bold">运营后台</span>
          </Link>
          <button className="lg:hidden text-white/60 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-accent text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <Link
            to="/"
            className="flex items-center gap-2 text-white/50 hover:text-white/80 text-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            返回C端
          </Link>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-14 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden text-gray-500 hover:text-gray-700"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="font-display text-navy text-lg font-bold">
                {adminNavItems.find((i) => i.path === location.pathname)?.label || '运营管理'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-navy/10 rounded-full flex items-center justify-center">
                <span className="text-navy text-sm font-bold">管</span>
              </div>
              <span className="text-sm text-text-light hidden sm:block">管理员</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
