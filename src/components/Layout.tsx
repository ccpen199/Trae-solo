import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import {
  Home,
  Search,
  FileText,
  CalendarCheck,
  CreditCard,
  Wrench,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  Shield,
} from 'lucide-react'

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/search', label: '房源搜索', icon: Search },
  { path: '/appointment', label: '预约看房', icon: CalendarCheck },
  { path: '/contract', label: '电子合同', icon: FileText },
  { path: '/payment', label: '支付中心', icon: CreditCard },
  { path: '/service', label: '租后服务', icon: Wrench },
  { path: '/admin', label: '后台管理', icon: Settings },
]

export default function Layout() {
  const { sidebarCollapsed, toggleSidebar } = useStore()
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-60'
        } bg-gradient-to-b from-space-800 to-space-900 text-white flex flex-col transition-all duration-300 relative flex-shrink-0`}
      >
        <div className={`p-4 flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} border-b border-white/10`}>
          <div className="w-9 h-9 rounded-lg bg-ccb-500 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="animate-fade-in">
              <h1 className="font-serif text-base font-semibold leading-tight">建融家园</h1>
              <p className="text-[10px] text-space-300 leading-tight">银行系住房租赁平台</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 space-y-0.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path))
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-ccb-500 text-white shadow-md shadow-ccb-500/30'
                    : 'text-space-300 hover:text-white hover:bg-white/5'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="text-sm font-medium animate-fade-in">{item.label}</span>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className={`p-3 border-t border-white/10 ${sidebarCollapsed ? 'px-2' : ''}`}>
          <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <Shield className="w-4 h-4 text-gold-400 flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-[11px] text-space-300">监管备案已接入</span>
            )}
          </div>
        </div>

        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 w-6 h-6 bg-ccb-500 rounded-full flex items-center justify-center shadow-lg hover:bg-ccb-600 transition-colors z-10"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-white" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-white" />
          )}
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
