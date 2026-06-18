import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  Home,
  Shield,
  Calculator,
  FileText,
  MapPin,
  Layers,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Settings,
} from 'lucide-react'
import { useStore } from '@/store'

const navItems = [
  { path: '/', label: '服务大厅', icon: Home },
  { path: '/insurance/verify', label: '参保核验', icon: Shield },
  { path: '/pension/calculator', label: '养老金模拟器', icon: Calculator },
  { path: '/unemployment/apply', label: '失业补贴申领', icon: FileText },
  { path: '/medical/institutions', label: '医保机构查询', icon: MapPin },
  { path: '/admin', label: '管理后台', icon: Layers },
]

export default function Layout() {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { sidebarCollapsed, toggleSidebar, user, notifications } = useStore()
  const navigate = useNavigate()

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`flex-shrink-0 flex flex-col bg-white border-r transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          {!sidebarCollapsed && (
            <span className="text-lg font-semibold text-primary truncate">
              省级社保公共服务门户
            </span>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon size={20} className="flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b flex-shrink-0">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 w-80">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="搜索服务..."
              className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder-gray-400"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-gray-50 text-gray-500">
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User size={16} className="text-primary" />
                </div>
                {!sidebarCollapsed && (
                  <span className="text-sm text-gray-700">{user?.name || '用户'}</span>
                )}
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-20">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        navigate('/admin')
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Settings size={16} />
                      系统设置
                    </button>
                    <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-danger hover:bg-gray-50">
                      <LogOut size={16} />
                      退出登录
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
