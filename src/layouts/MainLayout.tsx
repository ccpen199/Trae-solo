import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Newspaper,
  Building2,
  MessageSquareWarning,
  Video,
  MapPin,
  ShieldCheck,
  TrendingUp,
  Award,
  LogOut,
  Menu,
  X,
  Briefcase,
  Crown,
  User,
} from 'lucide-react'
import { useAuth } from '@/stores/auth'

const roleBadgeConfig: Record<string, { label: string; icon: any; className: string }> = {
  admin: { label: '超级管理员', icon: Crown, className: 'bg-amber-100 text-amber-700 border-amber-200' },
  editor: { label: '编辑', icon: Newspaper, className: 'bg-blue-100 text-blue-700 border-blue-200' },
  user: { label: '市民', icon: User, className: 'bg-green-100 text-green-700 border-green-200' },
}

const navItems = [
  { to: '/', label: '数据概览', icon: LayoutDashboard, roles: ['admin', 'editor', 'user'] },
  { to: '/news', label: '新闻资讯', icon: Newspaper, roles: ['admin', 'editor'] },
  { to: '/services', label: '便民服务', icon: Building2, roles: ['admin', 'editor', 'user'] },
  { to: '/complaints', label: '市民问政', icon: MessageSquareWarning, roles: ['admin', 'editor', 'user'] },
  { to: '/media', label: '视听创作', icon: Video, roles: ['admin', 'editor'] },
  { to: '/poi', label: '本地生活', icon: MapPin, roles: ['admin', 'editor', 'user'] },
  { to: '/review', label: '内容审核', icon: ShieldCheck, roles: ['admin', 'editor'] },
  { to: '/opinion', label: '舆情监测', icon: TrendingUp, roles: ['admin', 'editor'] },
  { to: '/credits', label: '信用积分', icon: Award, roles: ['admin'] },
]

export default function MainLayout() {
  const { user, workspace, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleConfig = user?.role ? roleBadgeConfig[user.role] : null
  const RoleIcon = roleConfig?.icon || User

  const filteredNavItems = navItems.filter((item) => !user?.role || item.roles.includes(user.role))

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-56 bg-slate-900 text-white flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-700">
          <h1 className="text-sm font-bold leading-tight">广州市融媒体公共服务中枢平台</h1>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-slate-700 text-white font-medium'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-slate-600 hover:text-slate-900"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            {workspace && (
              <div className="hidden md:flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm">
                <Briefcase size={14} />
                <span className="font-medium">{workspace.name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                {roleConfig && (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${roleConfig.className}`}>
                    <RoleIcon size={12} />
                    {roleConfig.label}
                  </span>
                )}
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-800 leading-tight">
                    {user.display_name || user.username}
                  </p>
                  <p className="text-xs text-slate-400">
                    信用积分 {user.credit_score}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-medium text-sm">
                  {(user.display_name || user.username).charAt(0)}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">退出</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
