import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { PawPrint, Bell, User, ChevronDown, Menu, X } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const navLinks = [
  { path: '/', label: '首页' },
  { path: '/pets', label: '宠物档案' },
  { path: '/adoptions', label: '领养中心' },
  { path: '/breedings', label: '配种广场' },
  { path: '/qa', label: '问答社区' },
  { path: '/shop', label: '商城' },
  { path: '/community', label: '社区' },
]

export default function Layout() {
  const location = useLocation()
  const { user, isLoggedIn, logout } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-cream font-body">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <PawPrint className="w-8 h-8 text-primary" />
              <span className="heading-font text-xl font-bold text-text-primary">宠物生活</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors relative
                    ${isActive(link.path)
                      ? 'text-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-stone-50'
                    }`}
                >
                  {link.label}
                  {isActive(link.path) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button className="relative p-2 text-text-secondary hover:text-text-primary transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
              </button>

              {isLoggedIn ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-text-primary">{user?.name || '用户'}</span>
                    <ChevronDown className="w-4 h-4 text-text-secondary" />
                  </button>

                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-stone-100 py-1 z-20">
                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-2 text-sm text-text-primary hover:bg-stone-50"
                        >
                          个人中心
                        </Link>
                        <Link
                          to="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-2 text-sm text-text-primary hover:bg-stone-50"
                        >
                          管理后台
                        </Link>
                        <button
                          onClick={() => { logout(); setShowUserMenu(false) }}
                          className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-red-50"
                        >
                          退出
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  to="/profile"
                  className="px-4 py-1.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-600 active:scale-95 transition"
                >
                  登录
                </Link>
              )}
            </div>

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-text-secondary"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {showMobileMenu && (
          <div className="md:hidden border-t border-stone-100 bg-white">
            <div className="container mx-auto px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${isActive(link.path) ? 'text-primary bg-primary-50' : 'text-text-secondary hover:bg-stone-50'}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  )
}
