import { NavLink } from 'react-router-dom'
import { useAppStore } from '@/store'
import {
  LayoutDashboard,
  Package,
  Truck,
  MapPin,
  Shield,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Boxes,
  UserCog,
  AlertTriangle,
  FileDigit,
  FileSearch,
  CreditCard,
  Fuel,
  Settings2,
  ClipboardList,
} from 'lucide-react'

interface NavItem {
  path: string
  label: string
  icon: any
  children?: { path: string; label: string }[]
}

const navItems: NavItem[] = [
  {
    path: '/dashboard',
    label: '数据总览',
    icon: LayoutDashboard,
  },
  {
    path: '/cargo',
    label: '货源管理',
    icon: Package,
    children: [
      { path: '/cargo', label: '订单列表' },
      { path: '/cargo/publish', label: '发布货源' },
      { path: '/cargo/erp-config', label: 'ERP对接配置' },
    ],
  },
  {
    path: '/capacity',
    label: '运力池管理',
    icon: Truck,
    children: [
      { path: '/capacity', label: '运力分级列表' },
      { path: '/capacity/return', label: '返程车源' },
    ],
  },
  {
    path: '/tracking',
    label: '货物追踪',
    icon: MapPin,
    children: [
      { path: '/tracking', label: '运输总览' },
      { path: '/tracking/alerts', label: '异常告警中心' },
    ],
  },
  {
    path: '/insurance',
    label: '人保货物险',
    icon: Shield,
    children: [
      { path: '/insurance', label: '投保服务首页' },
      { path: '/insurance/apply', label: '在线投保' },
      { path: '/insurance/policies', label: '保单管理' },
      { path: '/insurance/claims', label: '理赔中心' },
    ],
  },
  {
    path: '/service',
    label: '后市场服务',
    icon: Wrench,
    children: [
      { path: '/service', label: '服务中心首页' },
      { path: '/service/etc', label: 'ETC充值' },
      { path: '/service/fuel', label: '油卡折扣' },
      { path: '/service/maintenance', label: '维保服务' },
    ],
  },
]

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, currentRoute, setCurrentRoute } = useAppStore()

  return (
    <aside
      className={`flex flex-col h-full bg-gradient-primary text-white transition-all-smooth duration-300 flex-shrink-0 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 flex-shrink-0">
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Boxes className="w-5 h-5 text-success-400" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-wide">LogiSync</div>
              <div className="text-[10px] text-white/50">数字物流协同平台</div>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Boxes className="w-5 h-5 text-success-400" />
            </div>
          </div>
        )}
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const hasChildren = item.children && item.children.length > 0
          const isActive = currentRoute === item.path || (hasChildren && currentRoute.startsWith(item.path))

          if (!hasChildren) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setCurrentRoute(item.path)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all-smooth group ${
                  isActive
                    ? 'bg-white/10 text-success-300 shadow-inner'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-success-300' : 'group-hover:text-success-300'}`} />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </NavLink>
            )
          }

          return (
            <div key={item.path}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-default mb-1 ${
                  isActive ? 'text-white' : 'text-white/50'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="text-xs font-semibold uppercase tracking-wider">{item.label}</span>
                    <span className="ml-auto text-[10px] text-white/30">{item.children!.length}</span>
                  </>
                )}
              </div>
              {!sidebarCollapsed && (
                <div className="space-y-0.5 mb-2 ml-2 pl-4 border-l border-white/10">
                  {item.children!.map((child) => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      onClick={() => setCurrentRoute(child.path)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-all-smooth ${
                        currentRoute === child.path
                          ? 'bg-success-500/20 text-success-300 font-medium'
                          : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          currentRoute === child.path ? 'bg-success-400' : 'bg-white/20'
                        }`}
                      />
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* 底部折叠按钮 */}
      <div className="p-3 border-t border-white/10 flex-shrink-0">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-all-smooth"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!sidebarCollapsed && <span className="text-xs">收起侧栏</span>}
        </button>
      </div>
    </aside>
  )
}
