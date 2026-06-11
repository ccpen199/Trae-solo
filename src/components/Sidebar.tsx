import { NavLink } from 'react-router-dom'
import {
  Truck,
  LayoutDashboard,
  CalendarClock,
  ScanLine,
  Package,
  MapPin,
  ShieldAlert,
  Calculator,
  MessageSquareWarning,
  Receipt,
  Crown,
  ChevronsLeft,
  ChevronsRight,
  X,
} from 'lucide-react'
import { useAppStore } from '@/store'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '首页' },
  { to: '/pickup', icon: CalendarClock, label: '预约取件' },
  { to: '/scan', icon: ScanLine, label: '面单识别' },
  { to: '/waybill', icon: Package, label: '运单管理' },
  { to: '/tracking', icon: MapPin, label: '物流追踪' },
  { to: '/contraband', icon: ShieldAlert, label: '违禁品识别' },
  { to: '/freight', icon: Calculator, label: '运费计算' },
  { to: '/complaint', icon: MessageSquareWarning, label: '投诉工单' },
  { to: '/invoice', icon: Receipt, label: '电子发票' },
  { to: '/membership', icon: Crown, label: '会员中心' },
]

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, sidebarMobileOpen, setMobileSidebarOpen } = useAppStore()

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center h-14 px-4 border-b border-slate-800 shrink-0">
        <Truck className="w-6 h-6 text-brand-500 shrink-0" />
        {!sidebarCollapsed && (
          <span className="ml-3 text-base font-semibold text-slate-100 whitespace-nowrap">
            物流控制台
          </span>
        )}
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center mx-2 my-0.5 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`w-5 h-5 shrink-0 ${isActive ? 'text-amber-500' : 'text-slate-500 group-hover:text-slate-300'}`}
                />
                {!sidebarCollapsed && (
                  <span className="ml-3 text-sm whitespace-nowrap">{item.label}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-2 shrink-0">
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex items-center justify-center w-full py-2.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all duration-200"
        >
          {sidebarCollapsed ? (
            <ChevronsRight className="w-5 h-5" />
          ) : (
            <ChevronsLeft className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen bg-slate-950 border-r border-slate-800 z-30 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-slate-950 border-r border-slate-800 z-50 lg:hidden transition-transform duration-300 ${
          sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="absolute top-4 right-3 text-slate-500 hover:text-slate-300"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>
    </>
  )
}
