import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  GitMerge,
  BarChart3,
  Network,
  ChevronLeft,
  ChevronRight,
  Search,
  Zap,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useState } from 'react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '首页' },
  { path: '/talent', icon: Users, label: '人才中心' },
  { path: '/jobs', icon: Briefcase, label: '职位中心' },
  { path: '/match', icon: GitMerge, label: '智能匹配' },
  { path: '/analytics', icon: BarChart3, label: '数据分析' },
  { path: '/graph', icon: Network, label: '知识图谱' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, toggleSidebar, searchQuery, setSearchQuery } = useAppStore()
  const location = useLocation()
  const [searchFocused, setSearchFocused] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-steel-950">
      <aside
        className={`flex flex-col border-r border-steel-700/50 bg-steel-900/80 backdrop-blur-md transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-56'
        }`}
      >
        <div className="flex items-center gap-2 px-4 h-16 border-b border-steel-700/50">
          <Zap className="w-6 h-6 text-amber-500 flex-shrink-0" />
          {!sidebarCollapsed && (
            <span className="font-display text-amber-500 text-sm tracking-wider">AutoMatch</span>
          )}
        </div>

        <nav className="flex-1 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'text-steel-300 hover:bg-steel-800 hover:text-steel-100'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center h-12 border-t border-steel-700/50 text-steel-400 hover:text-amber-400 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between h-16 px-6 border-b border-steel-700/50 bg-steel-900/40 backdrop-blur-sm">
          <div className={`relative transition-all duration-300 ${searchFocused ? 'w-96' : 'w-72'}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="搜索人才、职位、技能..."
              className="w-full pl-10 pr-4 py-2 bg-steel-800 border border-steel-600 rounded-lg text-sm text-steel-100 placeholder-steel-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-steel-400 font-mono">
              {new Date().toLocaleDateString('zh-CN')}
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs font-semibold">
              HR
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
