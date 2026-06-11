import { NavLink, useLocation } from 'react-router-dom'
import { useAppStore } from '@/stores/useAppStore'
import {
  Home,
  ScanSearch,
  Scale,
  Video,
  Wrench,
  Package,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  User,
  HardHat,
  Truck,
  Settings,
} from 'lucide-react'

const userNav = [
  { to: '/', label: '首页', icon: Home },
  { to: '/diagnosis', label: 'AI诊断', icon: ScanSearch },
  { to: '/compare', label: '服务比价', icon: Scale },
  { to: '/live/demo', label: '服务直播', icon: Video },
]

const engineerNav = [
  { to: '/engineer', label: '工作台', icon: Wrench },
  { to: '/engineer/order/wo2', label: '电子工单', icon: FileText },
  { to: '/live/demo', label: '服务直播', icon: Video },
]

const supplierNav = [
  { to: '/supplier', label: '供应商管理', icon: Package },
]

const adminNav = [
  { to: '/admin', label: '后台管理', icon: ShieldCheck },
]

function FileText(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  )
}

const roleConfig = {
  user: { nav: userNav, icon: User, label: '用户端' },
  engineer: { nav: engineerNav, icon: HardHat, label: '工程师端' },
  supplier: { nav: supplierNav, icon: Truck, label: '供应商端' },
  admin: { nav: adminNav, icon: Settings, label: '管理后台' },
}

export default function Sidebar() {
  const { currentRole, setCurrentRole, sidebarCollapsed, toggleSidebar } = useAppStore()
  const location = useLocation()
  const config = roleConfig[currentRole]

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-navy-800/90 backdrop-blur-xl border-r border-cyber-400/10 z-50 transition-all duration-300 flex flex-col ${
        sidebarCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-cyber-400/10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyber-400 to-cyber-600 flex items-center justify-center flex-shrink-0">
          <Wrench className="w-4 h-4 text-navy-900" />
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold gradient-text-cyber whitespace-nowrap">家修互联</h1>
            <p className="text-[10px] text-navy-200 whitespace-nowrap">产业互联网平台</p>
          </div>
        )}
      </div>

      <div className="px-3 py-3">
        <div className={`flex ${sidebarCollapsed ? 'flex-col' : 'flex-wrap'} gap-1`}>
          {(Object.keys(roleConfig) as Array<keyof typeof roleConfig>).map((role) => {
            const rc = roleConfig[role]
            const Icon = rc.icon
            const isActive = role === currentRole
            return (
              <button
                key={role}
                onClick={() => setCurrentRole(role)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all ${
                  isActive
                    ? 'bg-cyber-400/15 text-cyber-400 border border-cyber-400/30'
                    : 'text-navy-200 hover:bg-navy-700/50 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="whitespace-nowrap">{rc.label}</span>}
              </button>
            )
          })}
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {config.nav.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to.split('/:')[0]))
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-cyber-400/10 text-cyber-400 border-l-2 border-cyber-400'
                  : 'text-navy-100 hover:bg-navy-700/50 hover:text-white border-l-2 border-transparent'
              }`}
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center h-10 border-t border-cyber-400/10 text-navy-200 hover:text-cyber-400 transition-colors"
      >
        {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  )
}
