import { NavLink, useLocation } from 'react-router-dom'
import { useStore } from '@/store'
import {
  LayoutDashboard,
  Map,
  Cpu,
  FileText,
  ShieldAlert,
  Users,
  Wallet,
  Activity,
  ChevronLeft,
  ChevronRight,
  Zap,
  Settings,
  Bell,
  UserCircle,
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: '运营仪表盘' },
  { path: '/map', icon: Map, label: '充电桩地图' },
  { path: '/devices', icon: Cpu, label: '设备管理' },
  { path: '/orders', icon: FileText, label: '订单与计费' },
  { path: '/billing', icon: Settings, label: '计费规则' },
  { path: '/alerts', icon: ShieldAlert, label: '安全与告警' },
  { path: '/safety', icon: Bell, label: '安全策略' },
  { path: '/users', icon: Users, label: '用户与信用' },
  { path: '/profile', icon: UserCircle, label: '个人中心' },
  { path: '/settlement', icon: Wallet, label: '结算与分润' },
  { path: '/prediction', icon: Activity, label: '故障预测' },
]

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useStore()
  const location = useLocation()

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-gradient-sidebar border-r border-surface-border z-40 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="flex items-center h-16 px-4 border-b border-surface-border">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-electric/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-electric" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-electric glow-text truncate">智充云</h1>
              <p className="text-[10px] text-slate-500 truncate">IoT Charging Platform</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path === '/devices' && location.pathname.startsWith('/devices/'))
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                isActive
                  ? 'bg-electric/10 text-electric shadow-glow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-600'
              }`}
            >
              <item.icon
                className={`w-5 h-5 flex-shrink-0 ${
                  isActive ? 'text-electric' : 'text-slate-500 group-hover:text-slate-300'
                }`}
              />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center h-12 border-t border-surface-border text-slate-500 hover:text-electric transition-colors"
      >
        {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  )
}
