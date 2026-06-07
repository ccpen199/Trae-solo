import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Home, Video, Building2, Hammer, BookOpen, User, LogIn, ChevronDown, Menu, X, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore, useUIStore } from '@/store'

export default function Navbar() {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const showLoginModal = useUIStore((state) => state.showLoginModal)
  const navigate = useNavigate()

  const navLinks = [
    { to: '/', label: '首页', icon: Home },
    { to: '/live', label: '直播', icon: Video },
    { to: '/properties', label: '房源', icon: Building2 },
    { to: '/renovation', label: '装修', icon: Hammer },
    { to: '/content', label: '内容', icon: BookOpen },
    { to: '/admin', label: '后台', icon: LayoutDashboard },
  ]

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">居</span>
            </div>
            <span className="text-xl font-bold text-slate-900">居界</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-teal-50 text-teal-600 border-b-2 border-teal-600'
                      : 'text-slate-600 hover:text-teal-600 hover:bg-teal-50/50'
                  )
                }
              >
                <Icon size={18} strokeWidth={1.5} />
                {label}
              </NavLink>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <User size={16} className="text-teal-600" strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{user.username}</span>
                  <ChevronDown size={16} className="text-slate-400" strokeWidth={1.5} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                    <button
                      onClick={() => {
                        navigate('/profile')
                        setUserMenuOpen(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                    >
                      个人中心
                    </button>
                    {user.role === 'admin' && (
                      <button
                        onClick={() => {
                          navigate('/admin')
                          setUserMenuOpen(false)
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                      >
                        管理后台
                      </button>
                    )}
                    <hr className="my-1 border-slate-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={showLoginModal}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
              >
                <LogIn size={16} strokeWidth={1.5} />
                <span className="text-sm font-medium">登录</span>
              </button>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100">
            <div className="flex flex-col gap-2">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-teal-50 text-teal-600'
                        : 'text-slate-600 hover:bg-slate-50'
                    )
                  }
                >
                  <Icon size={20} strokeWidth={1.5} />
                  {label}
                </NavLink>
              ))}
              <div className="pt-2 border-t border-slate-100">
                {user ? (
                  <>
                    <button
                      onClick={() => {
                        navigate('/profile')
                        setMobileMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
                    >
                      <User size={20} />
                      个人中心
                    </button>
                    <button
                      onClick={() => {
                        handleLogout()
                        setMobileMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <LogIn size={20} />
                      退出登录
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      showLoginModal()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-teal-600 text-white rounded-lg"
                  >
                    <LogIn size={20} />
                    登录 / 注册
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
