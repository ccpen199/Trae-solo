import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, BarChart3, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore, roleLabels } from '@/store/auth'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: '首页看板' },
    { to: '/schemes', icon: FolderKanban, label: '方案列表' },
    { to: '/retrospective', icon: BarChart3, label: '复盘看板' },
  ]

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-[240px] flex-shrink-0 bg-[#1e3a5f] text-white h-screen fixed left-0 top-0 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-lg font-bold">交互评审 Platform</h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-[#e8723a] text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col ml-[240px]">
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-sm font-medium">
                <User className="w-4 h-4" />
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{user?.username}</div>
                <span className="inline-block px-2 py-0.5 text-xs bg-[#dbeafe] text-[#1e3a5f] rounded">
                  {roleLabels[user?.role || '']}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              退出
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[#f5f6fa] p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
