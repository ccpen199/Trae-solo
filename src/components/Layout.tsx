import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Waves,
  Droplets,
  GitBranch,
  MapPin,
  Sprout,
  FileText,
  CalendarClock,
  PlayCircle,
  Monitor,
  BarChart3,
  Clock,
  User,
  Menu,
  X,
  Bell,
} from 'lucide-react'

const menuItems = [
  { path: '/', label: '首页概览', icon: LayoutDashboard },
  {
    path: '/canals',
    label: '灌区档案',
    icon: Waves,
    children: [
      { path: '/canals', label: '渠道管理' },
      { path: '/pumps', label: '泵站管理' },
      { path: '/gates', label: '闸门管理' },
      { path: '/zones', label: '灌区管理' },
      { path: '/crops', label: '作物管理' },
      { path: '/quotas', label: '用水定额' },
    ],
  },
  { path: '/applications', label: '用水申请', icon: FileText },
  { path: '/schedules', label: '调度计划', icon: CalendarClock },
  { path: '/dispatches', label: '执行调度', icon: PlayCircle },
  { path: '/monitoring', label: '执行监控', icon: Monitor },
  { path: '/reports', label: '用水报表', icon: BarChart3 },
  { path: '/logs', label: '操作日志', icon: Clock },
]

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['/canals'])
  const [currentTime, setCurrentTime] = useState(new Date())
  const location = useLocation()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const toggleMenu = (path: string) => {
    setExpandedMenus((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    )
  }

  const formatTime = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
    })
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-slate-800 text-white transition-all duration-300 flex flex-col overflow-hidden flex-shrink-0`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <Droplets className="h-8 w-8 text-blue-400" />
            <span className="text-lg font-bold">灌溉调度系统</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-slate-700 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => (
            <div key={item.path}>
              <NavLink
                to={item.path}
                end={!item.children}
                onClick={() => item.children && toggleMenu(item.path)}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm transition-colors cursor-pointer ${
                    isActive && !item.children
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`
                }
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span className="flex-1">{item.label}</span>
                {item.children && (
                  <span
                    className={`transform transition-transform ${
                      expandedMenus.includes(item.path) ? 'rotate-90' : ''
                    }`}
                  >
                    ›
                  </span>
                )}
              </NavLink>
              {item.children && expandedMenus.includes(item.path) && (
                <div className="bg-slate-900/50">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      className={({ isActive }) =>
                        `flex items-center pl-12 pr-4 py-2.5 text-sm transition-colors ${
                          isActive
                            ? 'bg-blue-600/30 text-blue-300 border-l-4 border-blue-500'
                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                        }`
                      }
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded hover:bg-gray-100 mr-4"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">
              {menuItems.find((m) =>
                m.children
                  ? m.children.some((c) => c.path === location.pathname)
                  : m.path === location.pathname
              )?.label || '灌溉调度系统'}
            </h1>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-600 hidden md:block">
              {formatTime(currentTime)}
            </div>
            <button className="relative p-2 rounded hover:bg-gray-100">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-gray-800">管理员</div>
                <div className="text-xs text-gray-500">系统管理员</div>
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

export default Layout
