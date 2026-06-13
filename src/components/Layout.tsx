import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { LogOut, User, ChevronDown, Stethoscope } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navActive = (path: string) =>
    location.pathname === path ? 'text-teal-700 font-semibold' : 'text-stone-600 hover:text-teal-700'

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Stethoscope className="w-8 h-8 text-teal-700" />
            <span className="font-heading text-2xl font-bold text-teal-700">医聘通</span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link to="/" className={`${navActive('/')} font-medium transition-colors`}>首页</Link>
            <Link to="/jobs" className={`${navActive('/jobs')} font-medium transition-colors`}>搜索筛选</Link>
            <Link to="/community" className={`${navActive('/community')} font-medium transition-colors`}>发现分类</Link>
            <Link to="/admin/dashboard" className={`${location.pathname.startsWith('/admin') ? 'text-teal-700 font-semibold' : 'text-stone-600 hover:text-teal-700'} font-medium transition-colors`}>管理后台</Link>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                {user.role === 'institution' && (
                  <Link
                    to="/job/post"
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium transition-colors"
                  >
                    发布职位
                  </Link>
                )}
                <div ref={dropdownRef} className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stone-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-teal-700" />
                    </div>
                    <span className="text-sm font-medium text-stone-700">{user.name}</span>
                    <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-stone-200 py-1 z-50">
                      {user.role === 'talent' && (
                        <>
                          <Link to="/resume" className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50" onClick={() => setDropdownOpen(false)}>我的简历</Link>
                          <Link to="/matches" className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50" onClick={() => setDropdownOpen(false)}>智能匹配</Link>
                          <Link to="/applications" className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50" onClick={() => setDropdownOpen(false)}>投递追踪</Link>
                        </>
                      )}
                      {user.role === 'institution' && (
                        <>
                          <Link to="/matches" className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50" onClick={() => setDropdownOpen(false)}>人才推荐</Link>
                          <Link to="/applications" className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50" onClick={() => setDropdownOpen(false)}>收到的投递</Link>
                        </>
                      )}
                      {user.role === 'admin' && (
                        <Link to="/admin/dashboard" className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50" onClick={() => setDropdownOpen(false)}>管理后台</Link>
                      )}
                      <Link to="/messages" className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50" onClick={() => setDropdownOpen(false)}>消息</Link>
                      <hr className="my-1 border-stone-100" />
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-stone-50 flex items-center gap-2">
                        <LogOut className="w-4 h-4" /> 退出登录
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-teal-700 border border-teal-700 rounded-lg hover:bg-teal-50 text-sm font-medium transition-colors">
                  登录
                </Link>
                <Link to="/register" className="px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 text-sm font-medium transition-colors">
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
