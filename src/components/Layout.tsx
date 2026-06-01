import { NavLink, Outlet } from 'react-router-dom'
import { Zap, LayoutDashboard, MapPin, Cpu, Receipt, Wrench, DollarSign } from 'lucide-react'

const navItems = [
  { to: '/', label: '仪表盘', icon: LayoutDashboard },
  { to: '/sites', label: '站点', icon: MapPin },
  { to: '/devices', label: '设备', icon: Cpu },
  { to: '/orders', label: '订单', icon: Receipt },
  { to: '/work-orders', label: '运维工单', icon: Wrench },
  { to: '/finance', label: '财务', icon: DollarSign },
]

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-60 bg-slate-900 text-white flex flex-col flex-shrink-0">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-700">
          <Zap className="w-6 h-6 text-cyan-400" />
          <span className="text-lg font-bold tracking-wide">充电站运营</span>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors pointer-events-auto ${
                  isActive
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-3 border-t border-slate-700 text-xs text-slate-500">
          v1.0.0
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 flex-shrink-0">
          <h1 className="text-base font-semibold text-slate-800">共享充电站运营管理系统</h1>
        </header>
        <main className="flex-1 overflow-auto bg-slate-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
