import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Tv, Menu, X, User, ChevronDown, LogOut, ShoppingCart, Settings } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

const NAV_LINKS = [
  { path: '/', label: '首页' },
  { path: '/news', label: '政务资讯' },
  { path: '/live', label: '直播' },
  { path: '/videos', label: '短视频' },
  { path: '/topics', label: '话题投票' },
  { path: '/quizzes', label: '互动答题' },
  { path: '/group-buys', label: '社区团购' },
  { path: '/merchants', label: '本地商户' },
]

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const location = useLocation()
  const { user, isLoggedIn, logout, fetchProfile } = useAuthStore()

  useEffect(() => {
    if (isLoggedIn && !user) {
      fetchProfile()
    }
  }, [])

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 h-16 bg-red-700 text-white z-50 shadow-md">
        <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Tv className="w-7 h-7" />
            <div className="leading-tight">
              <span className="text-lg font-bold">百姓关注</span>
              <span className="hidden sm:block text-[10px] text-red-200">贵州省级媒体融合公共服务平台</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  isActive(link.path)
                    ? 'bg-red-800 font-semibold'
                    : 'hover:bg-red-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isLoggedIn && user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded hover:bg-red-600 text-sm"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{user.username}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute right-0 mt-1 w-40 bg-white text-gray-800 rounded-lg shadow-lg py-1 z-50">
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        <Settings className="w-4 h-4" />
                        个人中心
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        我的订单
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          <Settings className="w-4 h-4" />
                          管理后台
                        </Link>
                      )}
                      <hr className="my-1" />
                      <button
                        onClick={() => {
                          logout()
                          setDropdownOpen(false)
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 w-full text-left text-red-600"
                      >
                        <LogOut className="w-4 h-4" />
                        退出登录
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-sm rounded hover:bg-red-600 transition-colors"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-sm rounded bg-white text-red-700 hover:bg-red-50 transition-colors font-medium"
                >
                  注册
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-1.5 rounded hover:bg-red-600"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="lg:hidden bg-red-800 border-t border-red-600 px-4 py-2 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded text-sm ${
                  isActive(link.path) ? 'bg-red-900 font-semibold' : 'hover:bg-red-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1 pt-16">
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold mb-3">关于我们</h3>
              <p className="text-sm leading-relaxed">
                百姓关注是贵州广播电视台打造的省级媒体融合公共服务平台，致力于为广大群众提供政务资讯、生活服务和互动参与的一站式服务平台。
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">服务项目</h3>
              <ul className="text-sm space-y-2">
                <li>政务资讯发布</li>
                <li>直播与短视频</li>
                <li>话题投票与互动答题</li>
                <li>社区团购与本地商户</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">联系方式</h3>
              <ul className="text-sm space-y-2">
                <li>电话：0851-12345678</li>
                <li>邮箱：contact@baixingguanzhu.cn</li>
                <li>地址：贵州省贵阳市观山湖区</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-xs space-y-1">
            <p>© 2026 百姓关注 贵州广播电视台</p>
            <p>黔ICP备XXXXXXXX号</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
