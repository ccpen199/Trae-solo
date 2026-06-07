import { NavLink, useLocation } from 'react-router-dom'
import {
  Home,
  Building2,
  Users,
  Calendar,
  LayoutDashboard,
  DollarSign,
  Building,
  FileText,
  UserCircle,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore, type UserRole } from '@/store/authStore'

interface MenuItem {
  path: string
  label: string
  icon: React.ElementType
  roles?: UserRole[]
}

const menuItems: MenuItem[] = [
  { path: '/', label: '工作台', icon: Home },
  { path: '/houses', label: '房源管理', icon: Building2 },
  { path: '/clients', label: '客源管理', icon: Users },
  { path: '/schedules', label: '带看日程', icon: Calendar },
  { path: '/transactions', label: '交易看板', icon: LayoutDashboard },
  { path: '/commissions', label: '佣金管理', icon: DollarSign },
  { path: '/organizations', label: '组织管理', icon: Building, roles: ['director', 'manager', 'admin'] },
  { path: '/audit', label: '审计日志', icon: FileText, roles: ['director', 'admin', 'platform'] },
  { path: '/profile', label: '个人中心', icon: UserCircle },
]

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)

  const filteredMenuItems = menuItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  )

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-primary text-white flex flex-col transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-primary-dark">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">鼎信地产</h1>
              <p className="text-xs text-zinc-400">经纪人工作台</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-1 hover:bg-primary-light rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 mb-2">
            <span className="text-xs text-zinc-400 uppercase tracking-wider px-3">
              主菜单
            </span>
          </div>
          <ul className="space-y-1 px-3">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={onToggle}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group',
                      isActive
                        ? 'bg-secondary text-primary font-medium'
                        : 'text-zinc-300 hover:bg-primary-light hover:text-white'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5 flex-shrink-0',
                        isActive ? 'text-primary' : 'text-zinc-400 group-hover:text-white'
                      )}
                    />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {user && (
          <div className="p-4 border-t border-primary-dark">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {user.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-zinc-400 truncate">
                  {user.role === 'director'
                    ? '总监'
                    : user.role === 'manager'
                    ? '店长'
                    : user.role === 'agent'
                    ? '经纪人'
                    : user.role === 'admin'
                    ? '系统管理员'
                    : user.role === 'platform'
                    ? '平台运营'
                    : user.role === 'ops'
                    ? '运维工程师'
                    : user.role}
                  {user.org_name && ` · ${user.org_name}`}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>

      <button
        onClick={onToggle}
        className={cn(
          'fixed top-4 left-4 z-30 lg:hidden p-2 bg-white rounded-lg shadow-md',
          isOpen && 'hidden'
        )}
      >
        <Menu className="w-5 h-5 text-primary" />
      </button>
    </>
  )
}
