import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Pill,
  FileText,
  PlusCircle,
  BarChart3,
  Settings,
  ChevronDown,
  Menu,
  X,
  User,
  Home,
} from 'lucide-react'
import { useAppStore, roleLabels, UserRole } from '@/store/useAppStore'

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: '首页仪表盘' },
  { path: '/drugs', icon: Pill, label: '药品库' },
  { path: '/reports', icon: FileText, label: '上报列表' },
  { path: '/reports/new', icon: PlusCircle, label: '新建上报' },
  { path: '/analytics', icon: BarChart3, label: '分析报表' },
  { path: '/admin', icon: Settings, label: '运营管理' },
]

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'doctor', label: '临床医生' },
  { value: 'pharmacist', label: '药师' },
  { value: 'qa', label: 'QA分析师' },
  { value: 'regulator', label: '监管人员' },
]

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)
  const location = useLocation()
  const { currentRole, userInfo, setCurrentRole } = useAppStore()

  const getBreadcrumbs = () => {
    const pathMap: Record<string, string> = {
      '/': '首页仪表盘',
      '/drugs': '药品库',
      '/reports': '上报列表',
      '/reports/new': '新建上报',
      '/analytics': '分析报表',
      '/admin': '运营管理',
    }
    const crumbs: { label: string; path?: string }[] = [{ label: '首页', path: '/' }]
    if (location.pathname !== '/') {
      crumbs.push({ label: pathMap[location.pathname] || '页面' })
    }
    return crumbs
  }

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role)
    setRoleDropdownOpen(false)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside
        className={`bg-white border-r border-gray-100 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Pill className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-800">ADR上报系统</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg mb-1 transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                } ${sidebarCollapsed ? 'justify-center' : ''}`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Home className="w-4 h-4" />
            {getBreadcrumbs().map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <span>/</span>}
                <span className={index === getBreadcrumbs().length - 1 ? 'text-gray-900' : ''}>
                  {crumb.label}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">{roleLabels[currentRole]}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                  {roleOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleRoleChange(option.value)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        currentRole === option.value
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-medium text-sm">
                  {userInfo.name.charAt(0)}
                </span>
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-800">{userInfo.name}</div>
                <div className="text-gray-500 text-xs">{userInfo.department}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
