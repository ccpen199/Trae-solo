import { NavLink } from 'react-router-dom'
import {
  Home,
  MessageSquarePlus,
  FileText,
  Briefcase,
  Gavel,
  FolderKanban,
  Award,
  LayoutDashboard,
  Scale,
  Users,
  ShieldCheck,
  BookOpen,
  MessageSquareWarning,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'

interface MenuItem {
  to: string
  icon: React.ElementType
  label: string
}

const userMenu: MenuItem[] = [
  { to: '/', icon: Home, label: '首页' },
  { to: '/consultation/submit', icon: MessageSquarePlus, label: '提交咨询' },
  { to: '/consultations', icon: FileText, label: '我的咨询' },
]

const lawyerMenu: MenuItem[] = [
  { to: '/lawyer/workspace', icon: Briefcase, label: '工作台' },
  { to: '/lawyer/grab', icon: Gavel, label: '抢单大厅' },
  { to: '/lawyer/cases', icon: FolderKanban, label: '我的案件' },
  { to: '/lawyer/qualification', icon: Award, label: '资质中心' },
]

const adminMenu: MenuItem[] = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: '运营监控台' },
  { to: '/lawyer/qualification', icon: ShieldCheck, label: '资质核验中心' },
  { to: '/lawyer/qualification', icon: BookOpen, label: '学分管理' },
  { to: '/dispute/arbitrate', icon: Scale, label: '仲裁处理' },
  { to: '/admin/dashboard', icon: MessageSquareWarning, label: '申诉管理' },
  { to: '/admin/dashboard', icon: BarChart3, label: '数据报表' },
]

export default function Sidebar() {
  const { userType } = useAuthStore()

  const getMenuItems = (): MenuItem[] => {
    switch (userType) {
      case 'user':
        return userMenu
      case 'lawyer':
        return lawyerMenu
      case 'admin':
        return adminMenu
      default:
        return []
    }
  }

  const menuItems = getMenuItems()

  return (
    <aside className="h-[calc(100vh-4rem)] w-64 border-r border-slate-200 bg-white">
      <nav className="flex flex-col gap-1 p-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
