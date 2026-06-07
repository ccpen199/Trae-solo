import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  HomeIcon,
  CalculatorIcon,
  AcademicCapIcon,
  ScaleIcon,
  BuildingOfficeIcon,
  ShoppingBagIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  ChevronDownIcon,
  UserGroupIcon,
  TicketIcon,
  ClockIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline'
import useAuthStore from '../store/authStore'

const Layout = ({ children }) => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const userNavItems = [
    { path: '/', icon: HomeIcon, label: '仪表盘' },
    { path: '/social-security', icon: CalculatorIcon, label: '社保测算' },
    { path: '/ai-interview', icon: AcademicCapIcon, label: 'AI面试' },
    { path: '/resume-optimize', icon: ChartBarIcon, label: '简历优化' },
    { path: '/compliance', icon: ScaleIcon, label: '合规咨询' },
    { path: '/contract-scan', icon: Cog6ToothIcon, label: '合同扫描' },
    { path: '/mall', icon: ShoppingBagIcon, label: '福利商城' },
  ]

  const enterpriseNavItems = [
    { path: '/enterprise', icon: HomeIcon, label: '企业工作台' },
    { path: '/enterprise/employees', icon: BuildingOfficeIcon, label: '员工管理' },
    { path: '/enterprise/compliance', icon: ScaleIcon, label: '合规巡检' },
    { path: '/enterprise/alerts', icon: BellIcon, label: '预警中心' },
    { path: '/enterprise/heatmap', icon: ChartBarIcon, label: '福利热力图' },
  ]

  const adminNavItems = [
    { path: '/admin', icon: HomeIcon, label: '运营概览' },
    { path: '/admin/audience-rules', icon: UserGroupIcon, label: '人群圈选' },
    { path: '/admin/redemption', icon: TicketIcon, label: '权益核销' },
    { path: '/admin/expiry', icon: ClockIcon, label: '过期失效' },
    { path: '/admin/audit-review', icon: ClipboardDocumentCheckIcon, label: '审计复查' },
    { path: '/admin/audit', icon: Cog6ToothIcon, label: '审计日志' },
    { path: '/admin/users', icon: BuildingOfficeIcon, label: '用户管理' },
  ]

  const getNavItems = () => {
    if (user?.role === 'admin') return adminNavItems
    if (user?.role === 'enterprise') return enterpriseNavItems
    return userNavItems
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-100 fixed h-full">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-primary-700">职场助手</h1>
          <p className="text-sm text-gray-500 mt-1">全生命周期数字平台</p>
        </div>
        
        <nav className="p-4 space-y-1">
          {getNavItems().map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 ml-64">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                欢迎回来，{user?.name}
              </h2>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors">
                <BellIcon className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 font-medium text-sm">
                      {user?.name?.charAt(0)}
                    </span>
                  </div>
                  <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 animate-fade-in">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-medium text-gray-800">{user?.name}</p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
