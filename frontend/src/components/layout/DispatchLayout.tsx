import { ReactNode, useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Map,
  TrendingUp,
  Gavel,
  ShieldCheck,
  Shield,
  Truck,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import Badge from '../ui/Badge'
import { DISPATCH_MENU } from '../../constants'

interface DispatchLayoutProps {
  children?: ReactNode
}

const iconMap: Record<string, React.ElementType> = {
  'layout-dashboard': LayoutDashboard,
  'map': Map,
  'trending-up': TrendingUp,
  'gavel': Gavel,
  'shield-check': ShieldCheck,
  'shield': Shield,
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' })
}

export default function DispatchLayout({ children }: DispatchLayoutProps) {
  const location = useLocation()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      <aside
        className={`
          ${collapsed ? 'w-20' : 'w-64'}
          bg-slate-950 border-r border-slate-800
          flex flex-col transition-all duration-300 ease-out
          fixed h-full z-30
        `}
      >
        <div className="h-16 flex items-center px-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 flex-shrink-0">
            <Truck className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="ml-3">
              <h1 className="text-base font-bold text-white">城运通</h1>
              <p className="text-[10px] text-slate-400">调度中心 v2.0</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 px-3 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            {DISPATCH_MENU.map((item) => {
              const Icon = iconMap[item.icon] || LayoutDashboard
              const isActive = item.path === '/dispatch'
                ? location.pathname === '/dispatch'
                : location.pathname.startsWith(item.path)

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl
                    transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-cyan-400' : ''}`} />
                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium flex-1">{item.name}</span>
                      {isActive && <ChevronRight className="w-4 h-4" />}
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-1">
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all">
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">系统设置</span>}
          </button>
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">退出登录</span>}
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col min-h-screen ${collapsed ? 'ml-20' : 'ml-64'} transition-all duration-300`}>
        <header className="h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-20">
          <div className="flex items-center justify-between h-full px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <ChevronRight className={`w-5 h-5 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
              </button>
              <div>
                <p className="text-xs text-slate-500">{formatDate(currentTime)}</p>
                <p className="text-lg font-mono font-semibold text-cyan-400">{formatTime(currentTime)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <Badge className="absolute -top-1 -right-1">12</Badge>
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">调度员</p>
                  <p className="text-xs text-slate-400">超级管理员</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-orange-500/30">
                  调
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 bg-slate-900">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  )
}
