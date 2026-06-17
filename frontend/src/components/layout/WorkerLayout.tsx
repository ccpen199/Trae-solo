import { ReactNode } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Briefcase, CheckSquare, User, Bell, Truck } from 'lucide-react'
import Badge from '../ui/Badge'

interface WorkerLayoutProps {
  children?: ReactNode
}

const navItems = [
  { path: '/worker', icon: LayoutDashboard, label: '工作台' },
  { path: '/worker/orders', icon: Briefcase, label: '需求大厅' },
  { path: '/worker/tasks', icon: CheckSquare, label: '我的任务' },
  { path: '/profile', icon: User, label: '我的' },
]

export default function WorkerLayout({ children }: WorkerLayoutProps) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-[480px] bg-gray-50 flex flex-col min-h-screen relative">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">城运通·工人端</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <Badge className="absolute -top-0.5 -right-0.5">5</Badge>
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-sm font-medium shadow-md">
                李
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 pb-20">
          {children || <Outlet />}
        </main>

        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-lg border-t border-gray-100 z-40">
          <div className="grid grid-cols-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = item.path === '/worker'
                ? location.pathname === '/worker'
                : location.pathname.startsWith(item.path)

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`
                    flex flex-col items-center justify-center py-2.5 px-2
                    transition-all duration-200
                    ${isActive ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'}
                  `}
                >
                  <div className={`relative transition-transform ${isActive ? 'scale-110' : ''}`}>
                    <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </NavLink>
              )
            })}
          </div>
          <div className="h-safe-area-inset-bottom bg-white" />
        </nav>
      </div>
    </div>
  )
}
