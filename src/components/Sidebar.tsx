import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  MapPin,
  Phone,
  AlertTriangle,
  Watch,
  Users,
  Shield,
  Activity,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react"
import { useState } from "react"

const navItems = [
  { path: "/", label: "仪表盘", icon: LayoutDashboard },
  { path: "/location", label: "定位与围栏", icon: MapPin },
  { path: "/calls", label: "通话管理", icon: Phone },
  { path: "/sos", label: "SOS告警", icon: AlertTriangle },
  { path: "/devices", label: "设备管理", icon: Watch },
  { path: "/members", label: "成员后台管理", icon: Users },
  { path: "/profile", label: "个人中心", icon: Users },
  { path: "/privacy", label: "隐私保护", icon: Shield },
  { path: "/analytics", label: "异常分析", icon: Activity },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-guardian-dark-800 border-r border-guardian-dark-500 flex flex-col transition-all duration-300 z-50 ${
        collapsed ? "w-[68px]" : "w-[220px]"
      }`}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-guardian-dark-500">
        <div className="w-8 h-8 rounded-lg bg-guardian-blue flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-white whitespace-nowrap">小卫士</h1>
            <p className="text-[10px] text-gray-500 whitespace-nowrap">儿童安全监护平台</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive
                  ? "bg-guardian-blue/15 text-guardian-blue"
                  : "text-gray-400 hover:text-gray-200 hover:bg-guardian-dark-600"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-guardian-blue" : ""}`} />
              {!collapsed && (
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              )}
              {isActive && (
                <div className="absolute left-0 w-[3px] h-6 bg-guardian-blue rounded-r-full" />
              )}
            </NavLink>
          )
        })}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-guardian-dark-500 text-gray-500 hover:text-gray-300 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  )
}
