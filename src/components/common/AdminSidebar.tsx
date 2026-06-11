import { Link, useLocation } from 'react-router-dom'
import { ShieldCheck, AlertTriangle, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const MENU_ITEMS = [
  { label: '合规审核', icon: ShieldCheck, path: '/admin' },
  { label: '风控看板', icon: AlertTriangle, path: '/admin/risk' },
  { label: '热度预测', icon: TrendingUp, path: '/admin/prediction' },
]

export default function AdminSidebar() {
  const location = useLocation()

  return (
    <aside className="fixed left-0 top-14 z-40 flex h-[calc(100vh-3.5rem)] w-56 flex-col bg-teal-800 py-6">
      <div className="mb-6 px-5">
        <h2 className="font-serif text-sm font-semibold text-teal-200 uppercase tracking-wider">
          管理后台
        </h2>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {MENU_ITEMS.map((item) => {
          const active = location.pathname === item.path
          const Icon = item.icon

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-teal-600 text-white'
                  : 'text-teal-200 hover:bg-teal-700 hover:text-white',
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-5 pt-4 border-t border-teal-700">
        <p className="text-xs text-teal-400">v1.0.0</p>
      </div>
    </aside>
  )
}
