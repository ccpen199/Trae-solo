import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Bell, ChevronDown, User, LogOut } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { ROLE_LABELS } from '@/types'
import type { UserRole } from '@/types'

const routeNameMap: Record<string, string> = {
  '/dashboard': '工作台',
  '/social-insurance': '社保查询',
  '/transfer': '关系转移',
  '/unemployment': '失业登记/申领',
  '/pension': '养老金测算',
  '/certification': '待遇资格认证',
  '/mediation': '劳动争议调解',
  '/qualification': '职业资格核验',
  '/e-voucher': '电子凭证',
  '/transit': '公共交通',
  '/culture': '文化场馆',
  '/security': '安全中心',
  '/data-board': '数据看板',
  '/audit-log': '审计日志',
  '/offline': '离线服务',
}

const roles: UserRole[] = ['insured', 'employed', 'retired', 'agent']

export default function Header() {
  const { toggleSidebar, currentRole, switchRole, user, notifications, markNotificationRead, logout } =
    useAppStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [roleOpen, setRoleOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const roleRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length
  const pageName = routeNameMap[location.pathname] || '首页'

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) setRoleOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="sticky top-0 z-20 h-14 bg-gov-blue flex items-center px-4 text-white shadow-card">
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-md hover:bg-gov-blue-light transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <nav className="ml-4 flex items-center text-sm">
        <span className="text-white/60">首页</span>
        <span className="mx-2 text-white/40">/</span>
        <span className="text-gov-gold-light font-medium">{pageName}</span>
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <div ref={roleRef} className="relative">
          <button
            onClick={() => { setRoleOpen(!roleOpen); setNotifOpen(false) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-gov-blue-light transition-colors text-sm"
          >
            <span>{ROLE_LABELS[currentRole]}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {roleOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-surface-card rounded-md shadow-card-hover py-1 z-50">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => { switchRole(role); setRoleOpen(false) }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    role === currentRole
                      ? 'text-gov-gold bg-gov-blue/5 font-medium'
                      : 'text-gov-blue hover:bg-surface-hover'
                  }`}
                >
                  {ROLE_LABELS[role]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setRoleOpen(false) }}
            className="relative p-2 rounded-md hover:bg-gov-blue-light transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] flex items-center justify-center rounded-full bg-status-danger text-[10px] font-bold leading-none">
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-surface-card rounded-md shadow-card-hover z-50 max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-sm text-gov-blue/50">暂无通知</div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gov-blue/5 last:border-0 transition-colors hover:bg-surface-hover ${
                      !n.read ? 'bg-gov-gold/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-gov-gold shrink-0" />}
                      <span className="text-sm font-medium text-gov-blue truncate">{n.title}</span>
                    </div>
                    <p className="text-xs text-gov-blue/60 mt-1 line-clamp-2">{n.content}</p>
                    <span className="text-[10px] text-gov-blue/40 mt-1 block">{n.time}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-1">
          <div className="w-7 h-7 rounded-full bg-gov-gold/20 flex items-center justify-center">
            <User className="w-4 h-4 text-gov-gold" />
          </div>
          <span className="text-sm font-medium">{user?.name ?? '未登录'}</span>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="ml-2 p-1.5 rounded-md hover:bg-gov-blue-light transition-colors"
            title="退出登录"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
