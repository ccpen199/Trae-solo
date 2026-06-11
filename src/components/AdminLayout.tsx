import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, AlertTriangle, FileSearch, ClipboardList, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: '数据看板', end: true },
  { to: '/admin/alerts', icon: AlertTriangle, label: '异常预警', end: false },
  { to: '/admin/review', icon: FileSearch, label: '人工复核', end: false },
  { to: '/admin/audit', icon: ClipboardList, label: '日志审计', end: false },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-bg flex">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-[220px] bg-primary text-white transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-center border-b border-white/10">
          <h1 className="text-base font-bold tracking-wide">后台管理平台</h1>
        </div>
        <nav className="mt-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-btn text-sm transition-colors ${
                  isActive ? 'bg-white/15 text-white font-medium' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-btn hover:bg-gray-100"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <h2 className="text-lg font-bold text-primary hidden lg:block">养老待遇资格认证后台管理平台</h2>
          </div>
          <div className="text-sm text-gray-500">
            {currentTime.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })}
            &nbsp;
            {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
