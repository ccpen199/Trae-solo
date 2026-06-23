import { NavLink } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Truck, type LucideIcon } from 'lucide-react'
import { useAppStore } from '../../store/app'
import { navItems } from '../../config/nav'
import { cn } from '../../utils'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const role = useAppStore((s) => s.currentRole)
  const items = navItems.filter((item) => item.roles.includes(role))

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-logistics-border bg-logistics-panel transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-logistics-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
          <Truck className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-semibold text-logistics-text">运联智链</span>
            <span className="truncate text-[11px] text-logistics-muted">B2B 物流协同平台</span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {items.map((item) => {
          const Icon = item.icon as LucideIcon
          return (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-primary-600/15 text-primary-400'
                    : 'text-logistics-muted hover:bg-logistics-border/40 hover:text-logistics-text'
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-logistics-border p-2">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-logistics-muted hover:bg-logistics-border/40 hover:text-logistics-text transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="text-xs">收起菜单</span>}
        </button>
      </div>
    </aside>
  )
}
