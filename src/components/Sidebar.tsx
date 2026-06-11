import { NavLink, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store'
import {
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Scale,
  LayoutDashboard,
  FileText,
  Search,
  Home,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/social-insurance', label: '社保查询', icon: ShieldCheck },
  { path: '/employment', label: '就业服务', icon: Briefcase },
  { path: '/talent', label: '人才服务', icon: GraduationCap },
  { path: '/labor', label: '劳动维权', icon: Scale },
  { path: '/admin/dashboard', label: '后台管理', icon: LayoutDashboard },
  { path: '/admin/logs', label: '操作日志', icon: FileText },
  { path: '/admin/policy', label: '政策检索', icon: Search },
]

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useAppStore()
  const location = useLocation()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-gradient-to-b from-primary-800 to-primary-900 text-white z-40 transition-all duration-300 flex flex-col',
        sidebarOpen ? 'w-60' : 'w-16'
      )}
    >
      <div className={cn('flex items-center h-16 px-4 border-b border-white/10', sidebarOpen ? 'justify-between' : 'justify-center')}>
        {sidebarOpen && (
          <div className="flex items-center gap-2 animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-serif font-bold leading-tight">粤人社</h1>
              <p className="text-[10px] text-primary-200 leading-tight">移动政务中台</p>
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="w-7 h-7 rounded-md hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path)
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                isActive
                  ? 'bg-white/15 text-white shadow-sm font-medium'
                  : 'text-primary-200 hover:bg-white/8 hover:text-white'
              )}
            >
              <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-accent-400')} />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {sidebarOpen && (
        <div className="p-4 border-t border-white/10 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold">
              张
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">张伟</p>
              <p className="text-xs text-primary-300 truncate">个人用户</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
