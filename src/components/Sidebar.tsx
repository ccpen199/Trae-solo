import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Package,
  Map,
  BookOpen,
  AlertTriangle,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    title: '数据概览',
    path: '/',
    icon: LayoutDashboard,
  },
  {
    title: '骑手管理',
    path: '/riders',
    icon: Users,
  },
  {
    title: '订单调度',
    path: '/orders',
    icon: Package,
  },
  {
    title: '运力网格',
    path: '/grids',
    icon: Map,
  },
  {
    title: '培训管理',
    path: '/training',
    icon: BookOpen,
  },
  {
    title: '履约监控',
    path: '/monitoring',
    icon: AlertTriangle,
  },
  {
    title: '数据分析',
    path: '/analytics',
    icon: BarChart3,
  },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-slate-900 text-white">
      <div className="flex h-16 items-center px-6 border-b border-slate-800">
        <h1 className="text-xl font-bold">众包配送调度中台</h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-slate-800 border-l-4 border-blue-500 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
