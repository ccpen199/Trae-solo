import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Battery, Activity, Wrench, ShieldAlert, BarChart3 } from 'lucide-react'
import type { ReactNode } from 'react'

const navItems = [
  { to: '/', label: '仪表盘', icon: LayoutDashboard },
  { to: '/batteries', label: '电池档案', icon: Battery },
  { to: '/usage', label: '使用记录', icon: Activity },
  { to: '/maintenance', label: '维护计划', icon: Wrench },
  { to: '/alerts', label: '安全告警', icon: ShieldAlert },
  { to: '/reports', label: '资产报表', icon: BarChart3 },
]

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 bg-[#0F172A] flex flex-col border-r border-slate-800 shrink-0">
        <div className="h-14 flex items-center px-5 border-b border-slate-800">
          <Battery className="w-6 h-6 text-sky-500 mr-2" />
          <span className="text-base font-semibold text-white tracking-wide">BMS</span>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const isActive =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 border-r-2 border-sky-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-[#0F172A] border-b border-slate-800 flex items-center px-6 shrink-0">
          <h1 className="text-lg font-semibold text-white">电池全生命周期管理系统</h1>
        </header>
        <main className="flex-1 p-6 overflow-auto bg-[#1E293B]">
          {children}
        </main>
      </div>
    </div>
  )
}
