import { NavLink } from 'react-router-dom'
import { Home, Bus, Building2, GraduationCap, Heart, FileCheck, ClipboardList, User, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MenuItem {
  path: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const menuItems: MenuItem[] = [
  { path: '/', label: '首页', icon: Home },
  { path: '/transport', label: '扫码乘车', icon: Bus },
  { path: '/social-security', label: '社保公积金', icon: Building2 },
  { path: '/household', label: '户籍业务', icon: FileCheck },
  { path: '/education', label: '教育服务', icon: GraduationCap },
  { path: '/health', label: '健康码', icon: Heart },
  { path: '/certificates', label: '电子证照', icon: FileCheck },
  { path: '/tracking', label: '办理中心', icon: ClipboardList },
  { path: '/profile', label: '用户中心', icon: User },
]

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-56 lg:w-60 flex-col bg-white border-r border-gray-200 h-[calc(100vh-64px)] sticky top-16">
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700')} />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight className={cn('w-4 h-4 opacity-0 transition-opacity', isActive && 'opacity-100')} />
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
