import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Scale,
  User,
  LogOut,
  ChevronDown,
  Shield,
  UserCheck,
  UserCircle,
  LayoutDashboard,
  Briefcase,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import Modal from '@/components/ui/Modal'

export default function Header() {
  const navigate = useNavigate()
  const { currentUser, userType, logout, login } = useAuthStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)

  const handleLogout = () => {
    logout()
    setShowDropdown(false)
    navigate('/')
  }

  const handleSwitchRole = async (role: 'user' | 'lawyer' | 'admin') => {
    const mockPhones: Record<string, string> = {
      user: '13800000001',
      lawyer: '13900000001',
      admin: '13700000001',
    }
    await login(role, mockPhones[role], '123456')
    setShowRoleModal(false)
    setShowDropdown(false)
    
    if (role === 'lawyer') {
      navigate('/lawyer/workspace')
    } else if (role === 'admin') {
      navigate('/admin/dashboard')
    } else {
      navigate('/')
    }
  }

  const roleLabel =
    userType === 'user' ? '普通用户' : userType === 'lawyer' ? '执业律师' : '平台管理员'

  const roleIcon =
    userType === 'user'
      ? UserCircle
      : userType === 'lawyer'
        ? UserCheck
        : Shield

  const RoleIcon = roleIcon

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <Scale className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold text-slate-900">法援在线</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            首页
          </Link>
          <Link
            to="/consultations"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            咨询
          </Link>
          <Link
            to="/lawyers"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            律师
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200">
                  <User className="h-4 w-4 text-slate-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-slate-900">
                    {currentUser.nickname}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <RoleIcon className="h-3 w-3" />
                    <span>{roleLabel}</span>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-slate-400 transition-transform',
                    showDropdown && 'rotate-180'
                  )}
                />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg">
                  <div className="p-2">
                    <button
                      onClick={() => setShowRoleModal(true)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      <Shield className="h-4 w-4" />
                      <span>切换角色（演示）</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>退出登录</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <User className="h-4 w-4" />
              登录
            </Link>
          )}
        </div>
      </div>

      <Modal
        open={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title="切换角色（演示）"
      >
        <div className="space-y-2">
          <button
            onClick={() => handleSwitchRole('user')}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
              userType === 'user'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            )}
          >
            <UserCircle className="h-5 w-5" />
            <div>
              <div className="font-medium">普通用户</div>
              <div className="text-xs text-slate-500">提交法律咨询，获得专业帮助</div>
            </div>
          </button>
          <button
            onClick={() => handleSwitchRole('lawyer')}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
              userType === 'lawyer'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            )}
          >
            <UserCheck className="h-5 w-5" />
            <div>
              <div className="font-medium">执业律师</div>
              <div className="text-xs text-slate-500">接收案件，提供法律服务</div>
            </div>
          </button>
          <button
            onClick={() => handleSwitchRole('admin')}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
              userType === 'admin'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            )}
          >
            <Shield className="h-5 w-5" />
            <div>
              <div className="font-medium">平台管理员</div>
              <div className="text-xs text-slate-500">监控平台运营，处理仲裁纠纷</div>
            </div>
          </button>
        </div>
      </Modal>
    </header>
  )
}
