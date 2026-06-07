import { NavLink, useLocation } from 'react-router-dom'
import { useAppStore } from '@/lib/store'
import {
  LayoutDashboard,
  Users,
  Receipt,
  FileText,
  CreditCard,
  FileCheck,
  Award,
  BookOpen,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react'

const allNavItems = [
  { path: '/', label: '工作台', icon: LayoutDashboard, roles: ['taxpayer', 'admin', 'agent'] },
  { path: '/taxpayers', label: '纳税人中心', icon: Users, roles: ['taxpayer', 'admin', 'agent'] },
  { path: '/tax-types', label: '税种管理', icon: Receipt, roles: ['taxpayer', 'admin', 'agent'] },
  { path: '/declarations', label: '申报管理', icon: FileText, roles: ['taxpayer', 'admin', 'agent'] },
  { path: '/payments', label: '缴款中心', icon: CreditCard, roles: ['taxpayer', 'admin', 'agent'] },
  { path: '/invoices', label: '发票管理', icon: FileCheck, roles: ['taxpayer', 'admin', 'agent'] },
  { path: '/certificates', label: '涉税证明', icon: Award, roles: ['taxpayer', 'admin', 'agent'] },
  { path: '/policies', label: '政策中心', icon: BookOpen, roles: ['taxpayer', 'admin', 'agent'] },
  { path: '/tickets', label: '征纳互动', icon: MessageSquare, roles: ['taxpayer', 'admin', 'agent'] },
  { path: '/admin', label: '管理后台', icon: Shield, roles: ['admin'] },
  { path: '/account', label: '账户中心', icon: Settings, roles: ['taxpayer', 'admin', 'agent'] },
]

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, user } = useAppStore()
  const location = useLocation()
  const role = user?.role || 'taxpayer'
  const navItems = allNavItems.filter(item => item.roles.includes(role))

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#1E3A5F] text-white flex flex-col transition-all duration-300 z-30 ${
        sidebarCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="h-14 flex items-center justify-center border-b border-white/10 px-3">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
              税
            </div>
            <span className="text-sm font-semibold tracking-wide">电子税务平台</span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
            税
          </div>
        )}
      </div>

      <div className="px-3 py-2">
        <div className={`text-xs text-white/40 ${sidebarCollapsed ? 'text-center' : 'px-2'}`}>
          {sidebarCollapsed ? role[0]?.toUpperCase() : { taxpayer: '纳税人端', admin: '管理端', agent: '代理端' }[role]}
        </div>
      </div>

      <nav className="flex-1 py-1 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path))
          return (
            <NavLink
              key={path}
              to={path}
              className={`flex items-center gap-3 mx-2 my-0.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-white/70 hover:bg-white/8 hover:text-white'
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {!sidebarCollapsed && <span>{label}</span>}
            </NavLink>
          )
        })}
      </nav>

      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="h-10 flex items-center justify-center border-t border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
      >
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  )
}
