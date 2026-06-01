import { useState } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  BookOpen,
  Users,
  GraduationCap,
  Building2,
  Calendar,
  FileText,
  Bell,
  BarChart3,
  Menu,
  X,
  LogOut,
  Home,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

interface NavItem {
  path: string
  label: string
  icon: React.ElementType
  roles?: string[]
}

const navItems: NavItem[] = [
  { path: '/', label: '首页', icon: Home },
  { path: '/courses', label: '课程管理', icon: BookOpen, roles: ['admin', 'dean'] },
  { path: '/teachers', label: '教师管理', icon: Users, roles: ['admin', 'dean'] },
  { path: '/classes', label: '班级管理', icon: GraduationCap, roles: ['admin', 'dean'] },
  { path: '/classrooms', label: '教室管理', icon: Building2, roles: ['admin', 'dean'] },
  { path: '/schedules', label: '排课计划', icon: Calendar },
  { path: '/adjustments', label: '调课申请', icon: FileText },
  { path: '/notifications', label: '通知中心', icon: Bell },
  { path: '/reports', label: '统计报表', icon: BarChart3, roles: ['admin', 'dean'] },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        <div
          className={cn(
            'fixed inset-0 bg-black/50 z-40 lg:hidden',
            sidebarOpen ? 'block' : 'hidden'
          )}
          onClick={() => setSidebarOpen(false)}
        />

        <aside
          className={cn(
            'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center h-16 px-4 border-b border-gray-200">
              <Calendar className="w-8 h-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-800">教务排课系统</span>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
              {filteredNavItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center px-4 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'text-blue-600 bg-blue-50 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {user && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500">
                      {user.role === 'admin' && '管理员'}
                      {user.role === 'dean' && '院系管理员'}
                      {user.role === 'teacher' && '教师'}
                      {user.role === 'student' && '学生'}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="ml-4 text-lg font-semibold text-gray-800">
              {filteredNavItems.find((item) => item.path === location.pathname)?.label || '教务排课系统'}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
