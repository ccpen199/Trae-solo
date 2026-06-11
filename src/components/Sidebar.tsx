import { NavLink } from 'react-router-dom'
import {
  Home,
  FileText,
  Brain,
  BookOpen,
  Target,
  Building2,
  Filter,
  BarChart3,
  Shield,
  LogOut,
  User,
} from 'lucide-react'
import { useStore } from '@/store'

interface NavItem {
  label: string
  icon: React.ElementType
  path: string
}

interface NavSection {
  title: string
  items: NavItem[]
  roleRestricted?: 'hr' | 'seeker'
}

const navSections: NavSection[] = [
  {
    title: '概览',
    items: [{ label: '工作台', icon: Home, path: '/' }],
  },
  {
    title: '简历',
    items: [
      { label: '简历管理', icon: FileText, path: '/resume' },
      { label: '智能诊断', icon: Brain, path: '/resume/diagnosis/new' },
    ],
    roleRestricted: 'seeker',
  },
  {
    title: '发现',
    items: [{ label: '大牛案例', icon: BookOpen, path: '/cases' }],
  },
  {
    title: '求职',
    items: [{ label: '进程管理', icon: Target, path: '/tracking' }],
    roleRestricted: 'seeker',
  },
  {
    title: 'HR空间',
    items: [
      { label: '协作空间', icon: Building2, path: '/hr' },
      { label: 'AI初筛', icon: Filter, path: '/hr/screening' },
      { label: '投递分析', icon: BarChart3, path: '/hr/analytics' },
    ],
    roleRestricted: 'hr',
  },
  {
    title: '合规',
    items: [{ label: '合规中心', icon: Shield, path: '/compliance' }],
  },
]

export default function Sidebar() {
  const { currentRole, currentUser, logout } = useStore()
  const isHr = currentRole === 'hr'

  const visibleSections = navSections.filter((section) => {
    if (!section.roleRestricted) return true
    if (section.roleRestricted === 'hr' && isHr) return true
    if (section.roleRestricted === 'seeker' && !isHr) return true
    return false
  })

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-navy-500 flex flex-col border-r border-navy-400/20">
      <div className="px-6 py-6 flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-amber-400 flex items-center justify-center">
          <FileText className="h-4.5 w-4.5 text-navy-700" />
        </div>
        <span className="font-display text-xl font-bold text-amber-400 tracking-wide">
          CareerForge
        </span>
      </div>

      <div
        className={`mx-3 mb-2 px-3 py-2 rounded-lg flex items-center gap-2 ${
          isHr
            ? 'bg-amber-400/15 text-amber-400'
            : 'bg-navy-300/15 text-navy-200'
        }`}
      >
        {isHr ? (
          <Building2 className="h-4 w-4 shrink-0" />
        ) : (
          <User className="h-4 w-4 shrink-0" />
        )}
        <span className="text-xs font-semibold">
          当前模式: {isHr ? 'HR' : '求职者'}
        </span>
      </div>

      <nav className="flex-1 px-3 overflow-y-auto">
        {visibleSections.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="px-4 mb-1.5 text-xs font-medium text-navy-300 uppercase tracking-wider flex items-center gap-1.5">
              {section.title}
              {section.roleRestricted === 'hr' && (
                <span className="inline-block text-[10px] font-semibold bg-amber-400 text-navy-700 px-1.5 py-0.5 rounded leading-none">
                  HR
                </span>
              )}
              {section.roleRestricted === 'seeker' && (
                <span className="inline-block text-[10px] font-semibold bg-navy-300 text-navy-700 px-1.5 py-0.5 rounded leading-none">
                  求职者
                </span>
              )}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                  }
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-navy-400/20">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-navy-300 flex items-center justify-center text-sm font-semibold text-navy-700">
            {currentUser?.name?.charAt(0) ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {currentUser?.name ?? '未登录'}
            </p>
            <span className="inline-block text-xs text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded mt-0.5">
              {isHr ? 'HR' : '求职者'}
            </span>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-navy-300 hover:bg-white/10 hover:text-white transition-colors duration-200"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
