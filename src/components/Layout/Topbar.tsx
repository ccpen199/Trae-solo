import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, UserCircle, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

const breadcrumbMap: Record<string, string> = {
  '/': '工作台',
  '/houses': '房源管理',
  '/clients': '客源管理',
  '/schedules': '带看日程',
  '/transactions': '交易看板',
  '/commissions': '佣金管理',
  '/organizations': '组织管理',
  '/audit': '审计日志',
  '/profile': '个人中心',
}

export default function Topbar() {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentPath = Object.keys(breadcrumbMap).find(
    (path) => location.pathname === path || location.pathname.startsWith(path + '/')
  )
  const breadcrumb = currentPath ? breadcrumbMap[currentPath] : ''

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
  }

  return (
    <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-2 text-sm">
        <Link to="/" className="text-zinc-500 hover:text-primary transition-colors">
          首页
        </Link>
        {breadcrumb && (
          <>
            <span className="text-zinc-300">/</span>
            <span className="text-primary font-medium">{breadcrumb}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          className="relative p-2 text-zinc-500 hover:text-primary hover:bg-zinc-100 rounded-lg transition-colors"
          aria-label="通知"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              <span className="text-primary font-semibold text-sm">
                {user?.name.charAt(0)}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-zinc-900">{user?.name}</p>
              <p className="text-xs text-zinc-500">
                {user?.role === 'director'
                  ? '总监'
                  : user?.role === 'manager'
                  ? '店长'
                  : '经纪人'}
              </p>
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-zinc-500 transition-transform',
                dropdownOpen && 'rotate-180'
              )}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-50">
              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
              >
                <UserCircle className="w-4 h-4" />
                个人中心
              </Link>
              <Link
                to="/profile?tab=settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
              >
                <Settings className="w-4 h-4" />
                账户设置
              </Link>
              <div className="border-t border-zinc-200 my-1" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-red-50 w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
