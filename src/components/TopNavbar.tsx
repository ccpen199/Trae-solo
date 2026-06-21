import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Search, User, LogOut, Settings as SettingsIcon, ChevronDown } from 'lucide-react'
import { useUserStore, demoUser } from '@/store/user'
import { cn } from '@/lib/utils'

export default function TopNavbar() {
  const user = useUserStore((state) => state.user)
  const logout = useUserStore((state) => state.logout)
  const elderlyMode = useUserStore((state) => state.elderlyMode)
  const toggleElderlyMode = useUserStore((state) => state.toggleElderlyMode)
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showElderlyTooltip, setShowElderlyTooltip] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isElderlyMode = elderlyMode

  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">长</span>
            </div>
            <span className="hidden sm:block text-lg font-semibold text-gray-900">长沙城市服务</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索服务、办事指南..."
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleElderlyMode}
            onMouseEnter={() => setShowElderlyTooltip(true)}
            onMouseLeave={() => setShowElderlyTooltip(false)}
            className={cn(
              'relative px-3 h-9 rounded-lg text-sm font-medium transition-colors',
              isElderlyMode
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <span className="hidden sm:inline">长辈版</span>
            <span className="sm:hidden text-base">长</span>
            {showElderlyTooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                {isElderlyMode ? '点击关闭老年人模式' : '点击开启老年人模式'}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </div>
            )}
          </button>

          <button className="relative p-2 h-9 w-9 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </button>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-1 pr-2 h-9 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">
                {user?.name || demoUser.name}
              </span>
              <ChevronDown className={cn('w-4 h-4 text-gray-500 transition-transform', showUserMenu && 'rotate-180')} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{user?.name || demoUser.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{user?.phone || demoUser.phone}</p>
                </div>
                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User className="w-4 h-4" />
                    个人中心
                  </Link>
                  <Link
                    to="/profile/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    设置
                  </Link>
                </div>
                <div className="border-t border-gray-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
