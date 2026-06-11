import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store'
import {
  LayoutDashboard,
  Grid3X3,
  Compass,
  Activity,
  Map,
  FileText,
  Plug,
  ArrowLeftRight,
  Bell,
  ChevronRight,
  Menu,
} from 'lucide-react'

const mainNav = [
  { to: '/', label: '工作台', icon: LayoutDashboard },
  { to: '/services', label: '服务大厅', icon: Grid3X3 },
  { to: '/guide', label: '智能导办', icon: Compass },
]

const adminNav = [
  { to: '/admin/monitor', label: '健康监测', icon: Activity },
  { to: '/admin/heatmap', label: '办事热力图', icon: Map },
  { to: '/admin/material', label: '材料减免', icon: FileText },
  { to: '/admin/integration', label: '服务接入', icon: Plug },
  { to: '/admin/relay', label: '省级回传', icon: ArrowLeftRight },
]

function Breadcrumb({ pathname }: { pathname: string }) {
  const segments = pathname.split('/').filter(Boolean)
  const nameMap: Record<string, string> = {
    services: '服务大厅',
    guide: '智能导办',
    ocr: 'OCR识别',
    track: '进度追踪',
    admin: '管理中心',
    monitor: '健康监测',
    heatmap: '办事热力图',
    material: '材料减免',
    integration: '服务接入',
    relay: '省级回传',
  }
  const crumbs = segments.map((s) => nameMap[s] || s)
  if (crumbs.length === 0) crumbs.push('工作台')

  return (
    <div className="flex items-center text-sm text-gray-500">
      <span className="text-gov-blue-500 font-medium">首页</span>
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center">
          <ChevronRight className="w-3 h-3 mx-1" />
          <span className={i === crumbs.length - 1 ? 'text-gray-800 font-medium' : ''}>
            {c}
          </span>
        </span>
      ))}
    </div>
  )
}

export default function Layout() {
  const { sidebarCollapsed, toggleSidebar, currentUser } = useAppStore()
  const location = useLocation()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-60'
        } bg-gov-blue-500 text-white flex flex-col transition-all duration-300 flex-shrink-0`}
      >
        <div className="h-14 flex items-center justify-center border-b border-gov-blue-400">
          {sidebarCollapsed ? (
            <span className="text-lg font-bold">政</span>
          ) : (
            <span className="text-lg font-bold tracking-wide">政务中枢工作台</span>
          )}
        </div>
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {mainNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center px-4 py-2.5 mx-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-gov-blue-400 text-white'
                    : 'text-gov-blue-100 hover:bg-gov-blue-400/50'
                } ${sidebarCollapsed ? 'justify-center' : ''}`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="ml-3">{item.label}</span>}
            </NavLink>
          ))}
          <div className="mx-4 my-3 border-t border-gov-blue-400" />
          {adminNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-4 py-2.5 mx-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-gov-blue-400 text-white'
                    : 'text-gov-blue-100 hover:bg-gov-blue-400/50'
                } ${sidebarCollapsed ? 'justify-center' : ''}`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="ml-3">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="p-1 hover:bg-gray-100 rounded">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <Breadcrumb pathname={location.pathname} />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-gray-100 rounded">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-alert rounded-full" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gov-blue-100 rounded-full flex items-center justify-center">
                <span className="text-gov-blue-600 text-sm font-medium">
                  {currentUser?.name?.charAt(0) || '用'}
                </span>
              </div>
              <span className="text-sm text-gray-700">{currentUser?.name || '市民用户'}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="animate-page-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
