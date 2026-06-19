import { Link } from 'react-router-dom'
import { ShieldAlert, BarChart3, ClipboardCheck, Map, Key, Home, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'

interface NavItem {
  label: string
  icon: React.ElementType
  to: string
}

const NAV_ITEMS: NavItem[] = [
  { label: '风控引擎', icon: ShieldAlert, to: '/admin/risk' },
  { label: '流量看板', icon: BarChart3, to: '/admin/traffic' },
  { label: '审核管理', icon: ClipboardCheck, to: '/admin/audit' },
  { label: '地理围栏', icon: Map, to: '/admin/geo' },
  { label: 'API管理', icon: Key, to: '/admin/api' },
]

export default function AdminSidebar({ activeRoute }: { activeRoute: string }) {
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <>
      {!sidebarOpen && (
        <button
          className="fixed top-20 left-2 z-40 md:hidden bg-navy-800 text-white p-2 rounded-lg shadow-lg"
          onClick={() => setSidebarOpen(true)}
        >
          <ChevronLeft className="w-4 h-4 rotate-180" />
        </button>
      )}

      <aside
        className={cn(
          'fixed md:static inset-y-0 left-0 z-30 w-60 bg-white border-r border-slate-200',
          'flex flex-col transition-transform duration-200',
          'md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-16 flex items-center px-5 border-b border-slate-200">
          <ShieldAlert className="w-5 h-5 text-navy-800 mr-2" />
          <span className="font-semibold text-navy-800">管理后台</span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeRoute === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-navy-800 text-white'
                    : 'text-slate-600 hover:bg-navy-50 hover:text-navy-800'
                )}
              >
                <item.icon className="w-4.5 h-4.5 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 pb-4 border-t border-slate-200 pt-4">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:bg-navy-50 hover:text-navy-800 transition-colors"
          >
            <Home className="w-4.5 h-4.5 shrink-0" />
            返回首页
          </Link>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  )
}
