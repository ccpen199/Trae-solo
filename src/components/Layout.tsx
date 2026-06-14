import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutGrid, PlusCircle, User, Shield, LogOut, Menu, X } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'

const navItems = [
  { to: '/', label: '任务广场', icon: LayoutGrid },
  { to: '/publish', label: '发布任务 / 提交订单', icon: PlusCircle },
  { to: '/profile', label: '个人中心', icon: User },
  { to: '/admin', label: '后台管理 / 风控管理', icon: Shield },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-emerald-primary/10 text-emerald-primary'
        : 'text-[#8B9BB4] hover:bg-[#162A45] hover:text-[#E8ECF1]'
    }`

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-primary to-emerald-dim flex items-center justify-center">
          <span className="text-navy-900 font-bold text-lg font-heading">互</span>
        </div>
        <span className="text-lg font-bold font-heading text-[#E8ECF1]">互助链</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={linkClass}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4">
        {isAuthenticated && user ? (
          <div className="rounded-lg bg-[#0A1628] border border-[#1E3352] p-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-primary/20 to-emerald-dim/20 flex items-center justify-center text-emerald-primary font-heading font-bold text-sm">
                {user.nickname?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#E8ECF1] truncate">{user.nickname}</div>
                <div className="text-xs text-[#5A6B82]">信用分 {user.credit_score}</div>
              </div>
              <div className="flex items-center gap-1 text-amber-primary text-xs font-medium">
                <span>{user.help_coins}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-2 flex items-center gap-2 text-xs text-[#5A6B82] hover:text-[#FF4757] transition-colors w-full px-1"
            >
              <LogOut size={14} />
              <span>退出登录</span>
            </button>
          </div>
        ) : (
          <NavLink
            to="/profile"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#8B9BB4] hover:bg-[#162A45] hover:text-[#E8ECF1] transition-all"
          >
            <User size={18} />
            <span>登录 / 注册</span>
          </NavLink>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A1628]">
      <aside className="hidden lg:flex relative z-[70] w-64 flex-shrink-0 border-r border-[#1E3352] bg-[#0F2035]">
        {sidebarContent}
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-[#0F2035] border-r border-[#1E3352] z-50">
            <button
              className="absolute top-4 right-4 text-[#8B9BB4] hover:text-[#E8ECF1]"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[#1E3352] bg-[#0F2035]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-[#8B9BB4] hover:text-[#E8ECF1] transition-colors"
            >
              <Menu size={22} />
            </button>
            <span className="font-bold font-heading text-[#E8ECF1]">互助链</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
