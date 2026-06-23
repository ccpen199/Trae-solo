import { NavLink, useLocation } from 'react-router-dom'
import { BarChart3, FileCheck, Activity, Database, Users, Settings, PawPrint } from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { path: '/admin', label: '数据概览', icon: BarChart3, exact: true },
  { path: '/admin/review', label: '内容审核', icon: FileCheck },
  { path: '/admin/supervision', label: '交易监管', icon: Activity },
  { path: '/admin/filing', label: '备案管理', icon: Database },
  { path: '/admin/users', label: '用户管理', icon: Users },
  { path: '/admin/settings', label: '系统设置', icon: Settings },
]

interface Props {
  mobileOpen: boolean
  onClose: () => void
}

export default function AdminSidebar({ mobileOpen, onClose }: Props) {
  const location = useLocation()

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden animate-fadeIn"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 lg:z-0 h-screen w-64 bg-white border-r border-stone-200 shadow-sm flex flex-col transition-transform lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <PawPrint className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="heading-font text-lg font-bold text-text-primary">管理后台</h2>
              <p className="text-xs text-text-secondary">宠物生活平台</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition',
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-secondary hover:bg-stone-100 hover:text-text-primary'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
        <div className="p-4 border-t border-stone-100">
          <div className="p-4 bg-stone-50 rounded-xl">
            <p className="text-xs text-text-secondary mb-2">系统状态</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-medium text-text-primary">运行正常</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
