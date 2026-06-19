import * as React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  User,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

interface HRMenuGroup {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const menuItems: HRMenuGroup[] = [
  {
    to: '/hr/dashboard',
    label: '数据看板',
    icon: LayoutDashboard,
  },
  {
    to: '/hr/talent-pool',
    label: '人才池',
    icon: Users,
    badge: '128',
  },
  {
    to: '/hr/warnings',
    label: '风险预警',
    icon: AlertTriangle,
    badge: '7',
  },
]

const HRLayout: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-space-indigo-50/30 to-lavender-50/40">
      <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col border-r border-white/60 bg-white/50 backdrop-blur-xl">
        <div className="h-16 px-6 flex items-center gap-2.5 border-b border-white/60 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-space-indigo-500 via-lavender-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-lavender-200/50">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-heading font-bold gradient-text">
              CareerGraph
            </div>
            <div className="text-[11px] text-slate-500 font-medium">HR 控制台</div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 pt-1">
            <span className="text-[10px font-semibold text-slate-400 uppercase tracking-wider">
              主菜单
            </span>
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium',
                    'transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-space-indigo-500/10 to-lavender-500/10 text-space-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:bg-white/60 hover:text-slate-900',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'w-5 h-5 shrink-0 transition-colors',
                        isActive ? 'text-emerald-500' : 'text-slate-400 group-hover:text-slate-600',
                      )}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <Badge
                        variant={isActive ? 'growth' : 'info'}
                      >
                          {item.badge}
                        </Badge>
                      )}
                    {isActive && (
                      <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                    <span
                      className={cn(
                        'absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-emerald-400 to-emerald-500 transition-all duration-300',
                        isActive ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/60 shrink-0 space-y-3">
          <div className="rounded-xl bg-gradient-to-br from-space-indigo-500/5 via-lavender-500/5 to-emerald-500/5 p-4 border border-white/60">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lavender-400 to-emerald-400 flex items-center justify-center text-white font-semibold">
                  <User className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-800 truncate">
                  招聘专员
                </div>
                <div className="text-xs text-slate-500 truncate">hr@company.com</div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate('/')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-white/60 hover:text-slate-800 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              设置
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
              退出
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export { HRLayout }
