import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
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
  FileCheck,
} from 'lucide-react'
import BusinessFlow from '@/components/BusinessFlow'

const navGroups = [
  {
    label: '业务办理',
    items: [
      { path: '/', label: '首页', icon: Home },
      { path: '/search', label: '房源搜索', icon: Search },
      { path: '/appointment', label: '预约看房', icon: CalendarCheck },
      { path: '/contract', label: '电子合同', icon: FileText },
      { path: '/payment', label: '支付中心', icon: CreditCard },
      { path: '/service', label: '租后服务', icon: Wrench },
    ]
  },
  {
    label: '监管后台',
    items: [
      { path: '/admin', label: '后台管理', icon: Settings },
      { path: '/admin?tab=filing', label: '监管备案', icon: FileCheck },
    ]
  },
]

const flowPaths = ['/search', '/listing/', '/appointment', '/contract', '/payment', '/service']

export default function Layout() {
  const { sidebarCollapsed, toggleSidebar } = useStore()
  const location = useLocation()
  const navigate = useNavigate()
  const showFlow = flowPaths.some(p => location.pathname.startsWith(p) || (p === '/listing/' && location.pathname.includes('/listing/')))

  const isPathActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    if (path.includes('?tab=')) {
      const basePath = path.split('?')[0]
      return location.pathname === basePath && location.search.includes(path.split('?')[1])
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } bg-gradient-to-b from-space-800 to-space-900 text-white flex flex-col transition-all duration-300 relative flex-shrink-0`}
      >
        <div className={`p-4 flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} border-b border-white/10`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ccb-500 to-ccb-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-ccb-500/30">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="animate-fade-in">
              <h1 className="font-serif text-lg font-semibold leading-tight">建融家园</h1>
              <p className="text-[11px] text-space-300 leading-tight mt-0.5">银行系住房租赁平台</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 space-y-4 px-3 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!sidebarCollapsed && (
                <p className="text-[11px] text-space-400 px-3 mb-2 font-medium">{group.label}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = isPathActive(item.path)
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group ${
                        isActive
                          ? 'bg-gradient-to-r from-ccb-500 to-ccb-600 text-white shadow-md shadow-ccb-500/30'
                          : 'text-space-300 hover:text-white hover:bg-white/5'
                      } ${sidebarCollapsed ? 'justify-center' : ''}`}
                    >
                      <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                      {!sidebarCollapsed && (
                        <span className="text-sm font-medium animate-fade-in">{item.label}</span>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className={`p-3 border-t border-white/10 ${sidebarCollapsed ? 'px-2' : ''}`}>
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-gold-500/10 to-gold-500/5 border border-gold-500/20 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <Shield className="w-4 h-4 text-gold-400 flex-shrink-0" />
            {!sidebarCollapsed && (
              <div>
                <span className="text-[11px] text-gold-400 font-medium block">住建部监管平台</span>
                <span className="text-[10px] text-space-400">已接入备案系统</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 w-6 h-6 bg-ccb-500 rounded-full flex items-center justify-center shadow-lg hover:bg-ccb-600 transition-colors z-10 cursor-pointer"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-white" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-white" />
          )}
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col bg-space-50">
        {showFlow && <BusinessFlow />}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
