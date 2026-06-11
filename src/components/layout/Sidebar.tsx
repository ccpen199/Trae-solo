import { Link, useLocation } from 'react-router-dom'
import {
  Search,
  ArrowRightLeft,
  Briefcase,
  Calculator,
  ShieldCheck,
  Scale,
  Award,
  CreditCard,
  Bus,
  Landmark,
  Lock,
  BarChart3,
  FileText,
  WifiOff,
  Shield,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import type { UserRole } from '@/types'

interface NavItem {
  label: string
  path: string
  icon: React.ElementType
  roles?: UserRole[]
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: '社保服务',
    items: [
      { label: '社保查询', path: '/social-insurance', icon: Search },
      { label: '关系转移', path: '/transfer', icon: ArrowRightLeft },
      { label: '失业登记/申领', path: '/unemployment', icon: Briefcase },
      { label: '养老金测算', path: '/pension', icon: Calculator },
      { label: '待遇资格认证', path: '/certification', icon: ShieldCheck },
      { label: '劳动争议调解', path: '/mediation', icon: Scale },
      { label: '职业资格核验', path: '/qualification', icon: Award },
    ],
  },
  {
    title: '民生服务',
    items: [
      { label: '电子凭证', path: '/e-voucher', icon: CreditCard },
      { label: '公共交通', path: '/transit', icon: Bus },
      { label: '文化场馆', path: '/culture', icon: Landmark },
    ],
  },
  {
    title: '系统管理',
    items: [
      { label: '安全中心', path: '/security', icon: Lock },
      { label: '数据看板', path: '/data-board', icon: BarChart3 },
      { label: '审计日志', path: '/audit-log', icon: FileText },
      { label: '离线服务', path: '/offline', icon: WifiOff },
    ],
  },
]

export default function Sidebar() {
  const { sidebarCollapsed, currentRole } = useAppStore()
  const location = useLocation()

  const visibleGroups = navGroups.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.roles || item.roles.includes(currentRole)
    ),
  })).filter((group) => group.items.length > 0)

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-surface-card shadow-sidebar z-30 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="flex items-center h-14 px-4 border-b border-gov-blue/10">
        <Shield className="w-7 h-7 text-gov-gold shrink-0" />
        {!sidebarCollapsed && (
          <span className="ml-3 text-sm font-serif font-bold text-gov-blue whitespace-nowrap">
            社保服务一体化工作台
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {visibleGroups.map((group) => (
          <div key={group.title} className="mb-2">
            {!sidebarCollapsed && (
              <div className="px-4 py-2 text-xs font-medium text-gov-blue/50 tracking-wider">
                {group.title}
              </div>
            )}
            {sidebarCollapsed && (
              <div className="mx-3 my-2 border-t border-gov-blue/10" />
            )}
            {group.items.map((item) => {
              const isActive = location.pathname === item.path
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center h-10 mx-2 rounded-md transition-colors ${
                    sidebarCollapsed ? 'justify-center px-0' : 'px-4'
                  } ${
                    isActive
                      ? 'bg-gov-blue/5 border-l-[3px] border-gov-gold text-gov-blue font-medium'
                      : 'text-gov-blue/70 hover:bg-surface-hover border-l-[3px] border-transparent'
                  }`}
                >
                  <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-gov-gold' : ''}`} />
                  {!sidebarCollapsed && (
                    <span className="ml-3 text-sm truncate">{item.label}</span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
