import { NavLink, Outlet } from 'react-router-dom'
import { usePlatformStore } from '@/store/platformStore'
import { useTheme } from '@/hooks/useTheme'
import {
  LayoutDashboard,
  Lightbulb,
  PenTool,
  BarChart3,
  ShoppingBag,
  ClipboardCheck,
  Shield,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Home,
} from 'lucide-react'

const navItems = [
  { path: '/', label: '工作台', icon: LayoutDashboard },
  { path: '/inspiration', label: '灵感库', icon: Lightbulb },
  { path: '/design', label: '设计协作', icon: PenTool },
  { path: '/construction', label: '施工进度', icon: BarChart3 },
  { path: '/materials', label: '建材商城', icon: ShoppingBag },
  { path: '/inspection', label: '验收系统', icon: ClipboardCheck },
  { path: '/blockchain', label: '上链存证', icon: Shield },
]

export default function Layout() {
  const { sidebarCollapsed, toggleSidebar } = usePlatformStore()
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`flex flex-col border-r border-surface-200 bg-white transition-all duration-300 dark:border-surface-700 dark:bg-surface-900 ${
          sidebarCollapsed ? 'w-[68px]' : 'w-[220px]'
        }`}
      >
        <div className="flex h-14 items-center gap-2 border-b border-surface-200 px-4 dark:border-surface-700">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Home size={18} />
          </div>
          {!sidebarCollapsed && (
            <div className="animate-fade-in overflow-hidden">
              <div className="text-sm font-bold text-surface-900 dark:text-white">筑居协同</div>
              <div className="text-[10px] text-surface-500">家装服务协同平台</div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center' : ''}`
                  }
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <item.icon size={20} className="shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="animate-fade-in truncate">{item.label}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-surface-200 p-2 dark:border-surface-700">
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="sidebar-link flex-1 justify-center"
              title={isDark ? '切换亮色' : '切换暗色'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={toggleSidebar}
              className="sidebar-link flex-1 justify-center"
              title={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
