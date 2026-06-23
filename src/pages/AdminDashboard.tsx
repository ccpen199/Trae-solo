import * as React from 'react'
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileCheck,
  Settings,
  LogOut,
  Crown,
} from 'lucide-react'
import AdminDashboardHome from './admin/Dashboard'
import AdminUsers from './admin/Users'
import AdminMasterReview from './admin/MasterReview'
import AdminCaseReview from './admin/CaseReview'
import AdminSettings from './admin/Settings'
import { cn } from '@/lib/utils'

const navItems = [
  { key: 'dashboard', label: '数据看板', icon: LayoutDashboard, path: '/admin/dashboard' },
  { key: 'users', label: '用户管理', icon: Users, path: '/admin/users' },
  { key: 'masters', label: '命名师审核', icon: UserCheck, path: '/admin/masters' },
  { key: 'cases', label: '案例审核', icon: FileCheck, path: '/admin/cases' },
  { key: 'settings', label: '系统设置', icon: Settings, path: '/admin/settings' },
]

export default function AdminDashboard() {
  const location = useLocation()
  const navigate = useNavigate()

  const currentSection = React.useMemo(() => {
    const path = location.pathname
    if (path.includes('dashboard')) return 'dashboard'
    if (path.includes('users')) return 'users'
    if (path.includes('masters')) return 'masters'
    if (path.includes('cases')) return 'cases'
    if (path.includes('settings')) return 'settings'
    return 'dashboard'
  }, [location.pathname])

  const handleLogout = () => {
    localStorage.removeItem('yamingxuan_token')
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-ink-900 flex">
      <aside className="w-56 bg-ink-950 border-r border-jade-900/50 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-jade-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-cinnabar-600 flex items-center justify-center border-2 border-cinnabar-500" style={{ boxShadow: '0 0 0 2px #7a1f1f' }}>
              <span className="font-serif text-lg font-bold text-ink-50">雅</span>
            </div>
            <div>
              <div className="font-serif text-lg font-bold text-ink-50 tracking-wider">雅名轩</div>
              <div className="text-xs text-jade-400">管理后台</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentSection === item.key
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all',
                  isActive
                    ? 'bg-jade-800/50 text-gold-400 font-medium border border-jade-700/50'
                    : 'text-jade-200 hover:bg-jade-900/30 hover:text-ink-50'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="p-3 border-t border-jade-900/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-jade-300 hover:bg-cinnabar-900/30 hover:text-cinnabar-300 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-6">
          <Routes>
            <Route path="/" element={<AdminDashboardHome />} />
            <Route path="dashboard" element={<AdminDashboardHome />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="masters" element={<AdminMasterReview />} />
            <Route path="cases" element={<AdminCaseReview />} />
            <Route path="settings" element={<AdminSettings />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
