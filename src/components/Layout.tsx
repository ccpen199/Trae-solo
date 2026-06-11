import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Home, Map, Route, Zap, Activity, Battery, Users, FileText, ChevronLeft, ChevronRight, Search, Bell, Settings, LogOut, UserCircle } from 'lucide-react'
import { useAppStore } from '@/store'

const navItems = [
  { path: '/', icon: Home, label: '首页总览', sub: '态势感知·网络监控' },
  { path: '/map', icon: Map, label: '充电站地图', sub: '实时空闲·筛选导航' },
  { path: '/route-plan', icon: Route, label: 'AI路径规划', sub: '多目的地·电量约束·电价排序' },
  { path: '/plug-charge', icon: Zap, label: '即插即充', sub: 'VIN+车牌双因子认证' },
  { path: '/charging-monitor', icon: Activity, label: '充电监控', sub: '实时曲线·故障上报闭环', notify: true },
  { path: '/orders', icon: FileText, label: '订单查询', sub: '可追溯180天·审计链路', notify: false },
  { path: '/v2g', icon: Battery, label: 'V2G策略', sub: '峰谷策略·收益明细·运行状态' },
  { path: '/community', icon: Users, label: '车友社区', sub: '帖子互动·话题沉淀' },
]

export default function Layout() {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore()
  const [searchFocused, setSearchFocused] = useState(false)
  const location = useLocation()

  return (
    <div className="flex h-screen bg-deep-blue overflow-hidden">
      <aside
        className="flex flex-col h-full bg-surface border-r border-white/5 transition-all duration-300 shrink-0"
        style={{ width: sidebarCollapsed ? '64px' : '240px' }}
      >
        <div className="flex items-center h-16 px-4 border-b border-white/5">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 animate-slide-right">
              <Zap className="w-6 h-6 text-electric-green" />
              <span className="text-lg font-bold text-electric-green glow-text">智充网联</span>
            </div>
          )}
          {sidebarCollapsed && <Zap className="w-6 h-6 text-electric-green mx-auto" />}
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label, sub, notify }) => (
            <NavLink
              key={path}
              to={path}
              className={() => {
                const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
                return `nav-item relative ${isActive ? 'nav-item-active' : ''} ${sidebarCollapsed ? 'justify-center px-2' : ''}`
              }}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!sidebarCollapsed && (
                <div className="flex flex-col">
                  <span>{label}</span>
                  <span className="text-[10px] text-gray-600 leading-none">{sub}</span>
                </div>
              )}
              {notify && <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full" />}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/5 py-2 px-2 space-y-1">
          <NavLink
            to="/admin"
            className={`nav-item ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
            title={sidebarCollapsed ? '运营后台' : undefined}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && <span>运营后台</span>}
          </NavLink>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`nav-item w-full ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            {!sidebarCollapsed && <span>收起侧栏</span>}
          </button>
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center justify-between h-16 px-6 bg-surface/50 backdrop-blur border-b border-white/5 shrink-0">
          <div className={`flex items-center gap-2 bg-deep-blue rounded-lg px-3 py-2 transition-all duration-200 ${searchFocused ? 'ring-1 ring-electric-green/30 w-96' : 'w-72'}`}>
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="搜索充电站、路线、车辆..."
              className="bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none w-full"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-electric-green rounded-full" />
            </button>
            <div className="flex items-center gap-3">
              <NavLink
                to="/login"
                className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/5 transition-colors"
                title="登录注册"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric-green/30 to-ice-blue/30 flex items-center justify-center text-sm font-medium text-electric-green">
                  <UserCircle className="w-4 h-4" />
                </div>
                <span className="hidden lg:inline text-xs text-gray-300">登录注册</span>
              </NavLink>
              <button className="p-1 rounded hover:bg-white/5" title="退出登录">
                <LogOut className="w-4 h-4 text-gray-500" />
              </button>
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
