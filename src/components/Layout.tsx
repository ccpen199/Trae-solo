import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import {
  Home,
  Search,
  MapPin,
  FileText,
  BarChart3,
  Users,
  FolderKanban,
  ScrollText,
  MessageSquare,
  Settings,
  LogIn,
  LogOut,
  Building2,
  ShieldCheck,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface MenuItem {
  key: string
  label: string
  icon: React.ElementType
  roles: string[]
}

const entrepreneurMenu: MenuItem[] = [
  { key: '/', label: '项目库', icon: Home, roles: ['entrepreneur'] },
  { key: '/projects', label: '找项目', icon: Search, roles: ['entrepreneur'] },
  { key: '/map', label: '商机地图', icon: MapPin, roles: ['entrepreneur'] },
  { key: '/my-franchises', label: '我的加盟', icon: Building2, roles: ['entrepreneur'] },
  { key: '/risk-reports', label: '风险评估', icon: ShieldCheck, roles: ['entrepreneur'] },
  { key: '/disputes', label: '纠纷工单', icon: AlertCircle, roles: ['entrepreneur', 'brand', 'admin'] },
]

const brandMenu: MenuItem[] = [
  { key: '/brand/dashboard', label: '招商看板', icon: BarChart3, roles: ['brand'] },
  { key: '/brand/projects', label: '项目管理', icon: FolderKanban, roles: ['brand'] },
  { key: '/brand/franchisees', label: '加盟商管理', icon: Users, roles: ['brand'] },
  { key: '/disputes', label: '纠纷工单', icon: AlertCircle, roles: ['entrepreneur', 'brand', 'admin'] },
]

const adminMenu: MenuItem[] = [
  { key: '/admin/review', label: '项目审核', icon: FileText, roles: ['admin'] },
  { key: '/admin/contracts', label: '合同模板', icon: ScrollText, roles: ['admin'] },
  { key: '/admin/disputes', label: '纠纷调解', icon: MessageSquare, roles: ['admin'] },
  { key: '/admin/performance', label: '履约监控', icon: BarChart3, roles: ['admin'] },
  { key: '/disputes', label: '纠纷工单', icon: AlertCircle, roles: ['entrepreneur', 'brand', 'admin'] },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)
  const [collapsed, setCollapsed] = useState(false)

  const getMenu = () => {
    if (!user) return [...entrepreneurMenu, ...adminMenu]
    if (user.role === 'admin') return [...adminMenu]
    if (user.role === 'brand') return [...brandMenu]
    return [...entrepreneurMenu]
  }

  const menu = getMenu()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleLogin = () => {
    navigate('/login')
  }

  const getRoleLabel = () => {
    if (!user) return ''
    const labels: Record<string, string> = {
      admin: '平台管理员',
      brand: '品牌方',
      entrepreneur: '创业者',
    }
    return labels[user.role] || ''
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={cn(
          'bg-slate-900 text-white transition-all duration-300 flex flex-col',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          {!collapsed && <span className="font-bold text-lg">盟信通</span>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {menu.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.key
            return (
              <Link
                key={item.key}
                to={item.key}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors',
                  isActive && 'bg-blue-600 hover:bg-blue-600'
                )}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-slate-700 p-4">
          {!collapsed && user && (
            <div className="mb-3">
              <p className="font-medium text-sm">{user.name}</p>
              <p className="text-xs text-slate-400">{getRoleLabel()}</p>
            </div>
          )}
          <button
            onClick={user ? handleLogout : handleLogin}
            className="flex items-center gap-3 w-full px-4 py-2 hover:bg-slate-700 rounded transition-colors text-slate-300 hover:text-white"
          >
            {user ? <LogOut size={20} className="flex-shrink-0" /> : <LogIn size={20} className="flex-shrink-0" />}
            {!collapsed && <span className="text-sm">{user ? '退出登录' : '登录演示账号'}</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {menu.find(m => m.key === location.pathname)?.label || '首页'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  )
}
