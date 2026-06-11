import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Network,
  FileSearch,
  Briefcase,
  Cpu,
  BarChart3,
  Car,
  ChevronLeft,
  ChevronRight,
  Search,
  FolderSearch,
  Settings,
} from 'lucide-react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '平台总览' },
  { path: '/search', icon: Search, label: '搜索筛选' },
  { path: '/discover', icon: FolderSearch, label: '分类发现' },
  { path: '/knowledge-graph', icon: Network, label: '知识图谱' },
  { path: '/resume-parser', icon: FileSearch, label: '简历解析' },
  { path: '/job-modeling', icon: Briefcase, label: '职位建模' },
  { path: '/matching', icon: Cpu, label: '匹配引擎' },
  { path: '/analytics', icon: BarChart3, label: '招聘分析' },
  { path: '/admin', icon: Settings, label: '后台管理' },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside
        className={`${
          collapsed ? 'w-16' : 'w-60'
        } bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col transition-all duration-300 flex-shrink-0`}
      >
        <div className="flex items-center gap-2 px-4 h-16 border-b border-slate-700/50">
          <Car className="w-7 h-7 text-amber-400 flex-shrink-0" />
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-base font-bold tracking-wide whitespace-nowrap">车聘通</h1>
              <p className="text-[10px] text-slate-400 whitespace-nowrap">汽车行业人才匹配平台</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 space-y-1 px-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                }`
              }
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-10 border-t border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/40 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
