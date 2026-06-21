import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Shield, Sun, User, Menu, X } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

const navLinks = [
  { label: '首页', path: '/' },
  { label: '政务办事', path: '/government' },
  { label: '城市服务', path: '/city-service' },
  { label: '公共服务', path: '/public-service' },
  { label: '智能导办', path: '/smart-guide' },
]

export default function Header() {
  const location = useLocation()
  const { elderlyMode, toggleElderlyMode, user } = useStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-gradient-to-r from-primary-500 to-primary-700 shadow-lg">
      <div className="flex items-center justify-between h-full px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-gold-400" />
            <span className="text-xl font-serif font-bold text-white">
              无锡
              <span className="text-gradient-gold">政务</span>
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                'relative px-4 py-2 text-sm font-medium transition-colors duration-200',
                isActive(link.path)
                  ? 'text-gold-300'
                  : 'text-white/80 hover:text-white'
              )}
            >
              {link.label}
              {isActive(link.path) && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-gold-400 rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleElderlyMode}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
              elderlyMode
                ? 'bg-gold-400 text-primary-900'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            )}
          >
            <Sun className="w-4 h-4" />
            <span className="hidden sm:inline">大字模式</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border-2 border-gold-400 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gold-400 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-900" />
                </div>
              )}
              <span className="hidden sm:inline text-sm text-white/90">{user.name}</span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 border border-gray-100">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50"
                  onClick={() => setUserMenuOpen(false)}
                >
                  个人中心
                </Link>
                <Link
                  to="/applications"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50"
                  onClick={() => setUserMenuOpen(false)}
                >
                  我的办事
                </Link>
                <hr className="my-1 border-gray-100" />
                <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                  退出登录
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-primary-600 border-t border-white/10 shadow-lg">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'block px-6 py-3 text-sm font-medium border-b border-white/5 transition-colors',
                isActive(link.path)
                  ? 'text-gold-300 bg-primary-700'
                  : 'text-white/80 hover:text-white hover:bg-primary-700/50'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
