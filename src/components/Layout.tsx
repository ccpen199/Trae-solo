import { useState } from 'react'
import { NavLink, useLocation, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, DoorOpen, HardDrive, Wrench, Users2,
  CreditCard, Megaphone, Building2, ShieldCheck, AlertTriangle,
  BarChart3, ChevronDown, ChevronLeft, Bell, LogOut, Menu,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  icon: React.ElementType
  path?: string
  children?: { label: string; path: string }[]
}

const navItems: NavItem[] = [
  { label: '工作台', icon: LayoutDashboard, path: '/' },
  {
    label: '门禁通行', icon: DoorOpen, children: [
      { label: '门禁开锁', path: '/access' },
      { label: '通行记录', path: '/access/records' },
      { label: '访客码', path: '/access/visitor-code' },
    ],
  },
  {
    label: '设备管理', icon: HardDrive, children: [
      { label: '设备列表', path: '/devices' },
      { label: '心跳监控', path: '/devices/heartbeat' },
      { label: 'OTA升级', path: '/devices/ota' },
      { label: '离线缓存', path: '/devices/offline-cache' },
    ],
  },
  {
    label: '报事报修', icon: Wrench, children: [
      { label: '工单列表', path: '/repairs' },
      { label: '创建工单', path: '/repairs/create' },
    ],
  },
  {
    label: '邻里圈', icon: Users2, children: [
      { label: '社区动态', path: '/community' },
      { label: '内容审核', path: '/community/review' },
    ],
  },
  {
    label: '物业缴费', icon: CreditCard, children: [
      { label: '缴费列表', path: '/payments' },
    ],
  },
  {
    label: '公告管理', icon: Megaphone, children: [
      { label: '公告列表', path: '/announcements' },
      { label: '发布公告', path: '/announcements/create' },
    ],
  },
  { label: '组织架构', icon: Building2, path: '/organization' },
  { label: '权限管理', icon: ShieldCheck, path: '/permissions' },
  {
    label: '设备告警', icon: AlertTriangle, children: [
      { label: '告警列表', path: '/alerts' },
    ],
  },
  { label: '统计报表', icon: BarChart3, path: '/reports' },
]

function SidebarNav() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const collapsed = useAppStore((s) => s.sidebarCollapsed)

  const toggleExpand = (label: string) => {
    if (collapsed) return
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
      {navItems.map((item) => {
        const Icon = item.icon
        const isExpanded = expanded[item.label]
        const hasChildren = item.children && item.children.length > 0

        return (
          <div key={item.label}>
            {item.path ? (
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 h-10 mx-2 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50',
                    collapsed && 'justify-center px-0 mx-1'
                  )
                }
              >
                <Icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ) : (
              <button
                onClick={() => toggleExpand(item.label)}
                className={cn(
                  'flex items-center gap-3 px-4 h-10 mx-2 rounded-lg text-sm w-full transition-colors',
                  'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50',
                  collapsed && 'justify-center px-0 mx-1'
                )}
              >
                <Icon size={20} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown
                      size={16}
                      className={cn('transition-transform', isExpanded && 'rotate-180')}
                    />
                  </>
                )}
              </button>
            )}
            {hasChildren && isExpanded && !collapsed && (
              <div className="ml-6 mt-1 space-y-0.5">
                {item.children!.map((child) => (
                  <NavLink
                    key={child.path}
                    to={child.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center px-4 h-9 rounded-lg text-sm transition-colors',
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-400 font-medium'
                          : 'text-slate-500 hover:text-slate-200 hover:bg-slate-700/50'
                      )
                    }
                  >
                    {child.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

function Breadcrumb() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)
  const labels: Record<string, string> = {
    '': '工作台', access: '门禁通行', records: '通行记录', 'visitor-code': '访客码',
    devices: '设备管理', heartbeat: '心跳监控', ota: 'OTA升级', 'offline-cache': '离线缓存',
    repairs: '报事报修', create: '创建工单', community: '邻里圈', review: '内容审核',
    payments: '物业缴费', announcements: '公告管理', organization: '组织架构',
    permissions: '权限管理', alerts: '设备告警', reports: '统计报表',
  }

  return (
    <div className="flex items-center gap-2 text-sm text-slate-400">
      <span>首页</span>
      {segments.map((seg, i) => (
        <span key={i} className="flex items-center gap-2">
          <span>/</span>
          <span className={i === segments.length - 1 ? 'text-slate-200' : ''}>
            {labels[seg] || seg}
          </span>
        </span>
      ))}
    </div>
  )
}

export default function Layout() {
  const { sidebarCollapsed, toggleSidebar, unreadCount, notifications, markNotificationRead } = useAppStore()
  const { user, logout } = useAuthStore()
  const [showNotif, setShowNotif] = useState(false)
  const count = unreadCount()

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside
        className={cn(
          'bg-slate-800 flex flex-col transition-all duration-300 shrink-0',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className={cn('h-16 flex items-center border-b border-slate-700', sidebarCollapsed ? 'justify-center' : 'px-5')}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <DoorOpen className="text-emerald-400" size={24} />
              <span className="text-white font-bold text-lg">智慧社区</span>
            </div>
          )}
          {sidebarCollapsed && <DoorOpen className="text-emerald-400" size={24} />}
        </div>
        <SidebarNav />
        <button
          onClick={toggleSidebar}
          className="h-10 flex items-center justify-center border-t border-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ChevronLeft size={18} className={cn('transition-transform', sidebarCollapsed && 'rotate-180')} />
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="lg:hidden text-slate-500 hover:text-slate-700">
              <Menu size={20} />
            </button>
            <Breadcrumb />
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Bell size={20} />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {count}
                  </span>
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b border-slate-100 font-medium text-slate-700">通知</div>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-sm">暂无通知</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={cn(
                          'p-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors',
                          !n.read && 'bg-blue-50/50'
                        )}
                      >
                        <div className="text-sm font-medium text-slate-700">{n.title}</div>
                        <div className="text-xs text-slate-500 mt-1">{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-medium">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-slate-700">{user?.name || '用户'}</div>
                <div className="text-xs text-slate-400">{user?.role?.display_name || user?.organization?.name || ''}</div>
              </div>
              <button onClick={logout} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" title="退出登录">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
