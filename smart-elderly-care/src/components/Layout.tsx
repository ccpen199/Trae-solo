import { type ReactNode, useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  FileSearch,
  Banknote,
  MessageSquareWarning,
  Building2,
  ClipboardList,
  BedDouble,
  FileCheck,
  Home,
  Pill,
  AlertTriangle,
  PhoneCall,
  Users,
  FileText,
  Route as RouteIcon,
  Shield,
  Briefcase,
  Heart,
  User,
  LogOut,
  ChevronDown,
  MapPin,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../types'

interface LayoutProps {
  children: ReactNode
  currentRole: Role
  onRoleChange: (role: Role) => void
}

interface NavItem {
  label: string
  icon: ReactNode
  path: string
}

interface NavGroup {
  role: Role
  label: string
  icon: ReactNode
  items: NavItem[]
}

const roleNavGroups: NavGroup[] = [
  {
    role: 'government',
    label: 'G端(民政监管)',
    icon: <Shield className="w-4 h-4" />,
    items: [
      { label: '监管看板', icon: <BarChart3 className="w-4 h-4" />, path: '/government/dashboard' },
      { label: '穿透审计', icon: <FileSearch className="w-4 h-4" />, path: '/government/audit' },
      { label: '补贴追踪', icon: <Banknote className="w-4 h-4" />, path: '/government/subsidy' },
      { label: '投诉管理', icon: <MessageSquareWarning className="w-4 h-4" />, path: '/government/complaints' },
    ],
  },
  {
    role: 'institution',
    label: 'B端(机构管理)',
    icon: <Briefcase className="w-4 h-4" />,
    items: [
      { label: '机构概览', icon: <Building2 className="w-4 h-4" />, path: '/institution/overview' },
      { label: '护理计划', icon: <ClipboardList className="w-4 h-4" />, path: '/institution/care-plan' },
      { label: '床位管理', icon: <BedDouble className="w-4 h-4" />, path: '/institution/beds' },
      { label: '电子签名', icon: <FileCheck className="w-4 h-4" />, path: '/institution/e-sign' },
    ],
  },
  {
    role: 'family',
    label: 'C端(家庭端)',
    icon: <Heart className="w-4 h-4" />,
    items: [
      { label: '家庭概览', icon: <Home className="w-4 h-4" />, path: '/family/overview' },
      { label: '用药追踪', icon: <Pill className="w-4 h-4" />, path: '/family/medication' },
      { label: '异常预警', icon: <AlertTriangle className="w-4 h-4" />, path: '/family/alerts' },
      { label: '紧急联系人', icon: <PhoneCall className="w-4 h-4" />, path: '/family/emergency' },
    ],
  },
]

const sharedNavItems: Omit<NavItem, 'path'>[] = [
  { label: '老人档案', icon: <Users className="w-4 h-4" /> },
  { label: '服务工单', icon: <FileText className="w-4 h-4" /> },
  { label: '智能调度', icon: <RouteIcon className="w-4 h-4" /> },
]

const roleBadgeConfig: Record<Role, { label: string; color: string }> = {
  government: { label: 'G端·民政监管', color: 'bg-gov-500' },
  institution: { label: 'B端·机构管理', color: 'bg-primary-500' },
  family: { label: 'C端·家庭端', color: 'bg-elderly-500' },
}

const roleEntryPath: Record<Role, string> = {
  government: '/government/dashboard',
  institution: '/institution/overview',
  family: '/family/overview',
}

export default function Layout({ children, currentRole, onRoleChange }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showRoleSwitch, setShowRoleSwitch] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const roleSwitchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
      if (roleSwitchRef.current && !roleSwitchRef.current.contains(e.target as Node)) {
        setShowRoleSwitch(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isActive = (path: string) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleRoleSwitch = (role: Role) => {
    onRoleChange(role)
    setShowRoleSwitch(false)
    navigate(roleEntryPath[role])
  }

  const sharedPathMap: Record<string, string> = {
    '老人档案': `/${currentRole}/elders`,
    '服务工单': `/${currentRole}/orders`,
    '智能调度': `/${currentRole}/dispatch`,
  }

  const availableRoles: Role[] = ['government', 'institution', 'family']

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <aside className="w-60 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="h-14 flex items-center px-5 border-b border-slate-700">
          <Shield className="w-6 h-6 text-primary-400 mr-2" />
          <span className="font-bold text-sm tracking-wide">智慧养老</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {roleNavGroups.filter(g => g.role === currentRole).map((group) => (
            <div key={group.role} className="mb-4">
              <div className="px-5 mb-2">
                <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  {group.icon}
                  {group.label}
                </div>
              </div>
              {group.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </div>
          ))}

          <div className="border-t border-slate-700 pt-4 mt-2">
            <div className="px-5 mb-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                共享功能
              </span>
            </div>
            {sharedNavItems.map((item) => {
              const path = sharedPathMap[item.label]
              return (
                <Link
                  key={item.label}
                  to={path}
                  className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                    isActive(path)
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="border-t border-slate-700 p-4">
          <div className="text-xs text-slate-500 text-center">
            v1.0.0
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-800">智慧养老综合服务平台</h1>
            <div ref={roleSwitchRef} className="relative">
              <button
                onClick={() => setShowRoleSwitch(!showRoleSwitch)}
                className={`${roleBadgeConfig[currentRole].color} text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 hover:opacity-90 transition-opacity`}
              >
                {roleBadgeConfig[currentRole].label}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showRoleSwitch && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                  {availableRoles.map((role) => (
                    <button
                      key={role}
                      onClick={() => handleRoleSwitch(role)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 ${
                        role === currentRole ? 'bg-slate-50 text-primary-600' : 'text-slate-700'
                      }`}
                    >
                      {role === 'government' && <Shield className="w-4 h-4" />}
                      {role === 'institution' && <Briefcase className="w-4 h-4" />}
                      {role === 'family' && <Heart className="w-4 h-4" />}
                      {roleBadgeConfig[role].label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 hover:bg-slate-50 px-2 py-1 rounded-lg transition-colors"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentRole === 'government' ? 'bg-gov-100 text-gov-600' :
                  currentRole === 'institution' ? 'bg-primary-100 text-primary-600' :
                  'bg-elderly-100 text-elderly-500'
                }`}>
                  <User className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-sm text-slate-700 font-medium">
                    {currentUser?.name || '用户'}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {currentUser?.department || '-'}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="text-sm font-medium text-slate-800">{currentUser?.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">账号：{currentUser?.username}</div>
                    <div className="text-xs text-slate-500 mt-0.5">部门：{currentUser?.department}</div>
                    <div className="text-xs text-slate-500 mt-0.5">权限：{currentUser?.permissions.length} 项</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-slate-50 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
