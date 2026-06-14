import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  QrCode,
  ShieldCheck,
  CreditCard,
  Server,
  Settings,
  Menu,
  X,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '工作台' },
  { to: '/qrcode', icon: QrCode, label: '市民码' },
  { to: '/verify', icon: ShieldCheck, label: '无感核验' },
  { to: '/cards', icon: CreditCard, label: '卡片管理' },
  { to: '/services', icon: Server, label: '服务资源' },
  { to: '/operations', icon: Settings, label: '运营管理' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 items-center gap-3 px-6" style={{ background: 'linear-gradient(135deg, #36cfc9, #1a6fb5)' }}>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
          <QrCode className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-white tracking-wide">杭州数字身份</span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
                  }`
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {!collapsed && (
        <div className="border-t border-border px-4 py-4">
          <p className="text-xs font-medium text-text-primary">杭州市数据局</p>
          <p className="mt-1 text-xs text-text-secondary">遵循《杭州市公共数据开放条例》</p>
        </div>
      )}
    </div>
  )

  return (
    <>
      <button
        type="button"
        className="fixed top-4 left-4 z-50 rounded-lg bg-white p-2 shadow-md md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 transition-all duration-300 md:relative md:z-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ width: collapsed ? 72 : 256 }}
      >
        {sidebarContent}

        <button
          type="button"
          className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-border bg-white shadow-sm md:flex"
          onClick={() => setCollapsed(!collapsed)}
        >
          <Menu className="h-3.5 w-3.5 text-text-secondary" />
        </button>
      </aside>
    </>
  )
}
