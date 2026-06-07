import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, Users, Briefcase, GitCompareArrows,
  UserSearch as Headhunting, ClipboardCheck, BarChart3, GraduationCap,
  Settings, ChevronLeft, ChevronRight, Bell, Search,
  Menu, X
} from 'lucide-react'
import useAppStore from '../stores/appStore'

const navGroups = [
  {
    label: '核心业务',
    items: [
      { path: '/', icon: LayoutDashboard, label: '工作台' },
      { path: '/candidates', icon: Users, label: '候选人' },
      { path: '/jobs', icon: Briefcase, label: '职位管理' },
      { path: '/matching', icon: GitCompareArrows, label: '匹配中心' },
    ],
  },
  {
    label: '服务流程',
    items: [
      { path: '/headhunter', icon: Headhunting, label: '猎头工作台' },
      { path: '/interviews', icon: ClipboardCheck, label: '面试评估' },
      { path: '/analytics', icon: BarChart3, label: '招聘分析' },
    ],
  },
  {
    label: '专项通道',
    items: [
      { path: '/campus', icon: GraduationCap, label: '校招通道' },
    ],
  },
  {
    label: '系统管理',
    items: [
      { path: '/admin', icon: Settings, label: '后台管理' },
    ],
  },
]

export default function Layout() {
  const { sidebarCollapsed, toggleSidebar, notifications, removeNotification } = useAppStore()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const breadcrumbs = (() => {
    const path = location.pathname
    if (path === '/') return ['工作台']
    const parts = path.split('/').filter(Boolean)
    const nameMap = {
      candidates: '候选人', jobs: '职位管理', matching: '匹配中心',
      headhunter: '猎头工作台', interviews: '面试评估',
      analytics: '招聘分析', campus: '校招通道', admin: '后台管理',
      new: '新建', communications: '沟通记录', followups: '跟进提醒',
      schedule: '日程管理', internships: '实习管理', ambassadors: '校园大使',
      credit: '企业信用', privacy: '隐私脱敏', 'ai-dataset': 'AI数据集',
      salary: '薪酬基准',
    }
    return ['首页', ...parts.map((p) => nameMap[p] || p)]
  })()

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <aside
        className={`hidden lg:flex flex-col bg-sidebar text-white transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className={`flex items-center h-16 border-b border-white/10 ${sidebarCollapsed ? 'justify-center' : 'px-5'}`}>
          {!sidebarCollapsed && (
            <span className="text-lg font-bold tracking-tight font-display">
              TalentMatch<span className="text-primary-light"> Pro</span>
            </span>
          )}
          {sidebarCollapsed && <span className="text-lg font-bold text-primary-light">T</span>}
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4">
              {!sidebarCollapsed && (
                <div className="px-5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {group.label}
                </div>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                        : 'text-slate-300 hover:bg-white/8 hover:text-white'
                    } ${sidebarCollapsed ? 'justify-center' : ''}`
                  }
                >
                  <item.icon size={18} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center h-12 border-t border-white/10 text-slate-400 hover:text-white transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center h-16 px-6 bg-card border-b border-border shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden mr-3 p-1.5 rounded-lg hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-2 text-sm text-muted">
            {breadcrumbs.map((bc, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="text-slate-300">/</span>}
                <span className={i === breadcrumbs.length - 1 ? 'text-slate-700 font-medium' : ''}>{bc}</span>
              </span>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="搜索候选人、职位..."
                className="pl-9 pr-4 py-2 w-64 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div className="relative">
              <Bell size={20} className="text-muted hover:text-slate-700 cursor-pointer transition-colors" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
              管
            </div>
          </div>
        </header>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-sidebar text-white p-4 border-b border-white/10">
            {navGroups.map((group) => (
              <div key={group.label} className="mb-3">
                <div className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {group.label}
                </div>
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                        isActive ? 'bg-primary text-white' : 'text-slate-300'
                      }`
                    }
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {notifications.length > 0 && (
        <div className="fixed top-20 right-6 z-50 flex flex-col gap-2 max-w-sm">
          {notifications.slice(-3).map((n) => (
            <div
              key={n.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm animate-slide-in ${
                n.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                n.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <span className="flex-1">{n.msg}</span>
              <button onClick={() => removeNotification(n.id)} className="text-current opacity-50 hover:opacity-100">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
