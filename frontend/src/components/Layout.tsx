import { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, PenSquare, Bell, User, LogOut, ChevronDown, Menu, X, Heart, Compass, Shield, Zap, CheckCircle, Crown, Award, FileCheck } from 'lucide-react'
import { getToken, getCurrentUser, removeToken, isAuthenticated } from '../utils/auth'
import api from '../utils/api'

const creatorLevels: Record<number, { name: string; color: string; bg: string }> = {
  0: { name: '新手创作者', color: 'text-gray-600', bg: 'bg-gray-100' },
  1: { name: '活跃创作者', color: 'text-green-600', bg: 'bg-green-100' },
  2: { name: '优质创作者', color: 'text-blue-600', bg: 'bg-blue-100' },
  3: { name: '精品创作者', color: 'text-purple-600', bg: 'bg-purple-100' },
  4: { name: '顶级创作者', color: 'text-amber-600', bg: 'bg-amber-100' },
}

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(getCurrentUser())
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchUser = async () => {
      if (isAuthenticated()) {
        try {
          const res = await api.get('/api/auth/me')
          if (res.data.code === 0) {
            setUser(res.data.data)
          }
        } catch {}
      }
    }
    fetchUser()
  }, [location.pathname])

  useEffect(() => {
    if (isAuthenticated()) {
      api.get('/api/notifications/unread-count').then(res => {
        if (res.data.code === 0) {
          setUnreadCount(res.data.data.count || res.data.data || 0)
        }
      }).catch(() => {})
    }
  }, [location.pathname])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const handleLogout = () => {
    removeToken()
    setUser(null)
    setDropdownOpen(false)
    navigate('/')
  }

  const getRoleInfo = () => {
    if (user?.role === 'admin') {
      return { label: '管理员', color: 'text-red-600', bg: 'bg-red-50', icon: Shield }
    }
    if (user?.role === 'author') {
      return { label: '创作者', color: 'text-purple-600', bg: 'bg-purple-50', icon: Zap }
    }
    return { label: '普通用户', color: 'text-gray-600', bg: 'bg-gray-50', icon: User }
  }

  const getLevel = () => {
    const level = user?.author_level || user?.creator_level || 0
    return creatorLevels[level] || creatorLevels[0]
  }

  const canViewEarnings = user?.role === 'author' || user?.role === 'admin'
  const isRegularUser = user?.role === 'user'
  const roleInfo = getRoleInfo()
  const level = getLevel()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">城</span>
            </div>
            <span className="text-lg font-bold text-gray-900 hidden sm:inline">城事志</span>
          </Link>

          <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索内容、话题、用户..."
                className="w-full pl-9 pr-3 py-1.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
              />
            </div>
          </form>

          <nav className="hidden md:flex items-center gap-1">
            <Link to="/" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:bg-gray-100'}`}>
              首页
            </Link>
            <Link to="/explore" className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/explore' ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:bg-gray-100'}`}>
              <span className="flex items-center gap-1"><Compass className="w-4 h-4" />发现</span>
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated() ? (
              <>
                <Link to="/create" className="btn-primary text-xs px-3 py-1.5 gap-1">
                  <PenSquare className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">创作</span>
                </Link>
                <Link to="/notifications" className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          {user?.avatar ? (
                            <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm truncate">{user?.nickname}</div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0 rounded ${roleInfo.bg} ${roleInfo.color}`}>
                                <roleInfo.icon className="w-2.5 h-2.5" />{roleInfo.label}
                              </span>
                              {(user?.author_certified === 1 || user?.is_certified === true) && (
                                <CheckCircle className="w-3 h-3 text-blue-500" />
                              )}
                            </div>
                          </div>
                        </div>
                        {((user?.author_level !== undefined && user.author_level > 0) || (user?.creator_level !== undefined && user.creator_level > 0)) && (
                          <div className={`mt-2 inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full ${level.bg} ${level.color}`}>
                            <Crown className="w-2.5 h-2.5" />{level.name}
                          </div>
                        )}
                      </div>
                      <Link
                        to={`/profile/${user?.id}`}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User className="w-4 h-4" />个人主页
                      </Link>
                      <Link
                        to="/collections"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Heart className="w-4 h-4" />我的收藏
                      </Link>
                      {canViewEarnings && (
                        <Link
                          to="/earnings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Award className="w-4 h-4" />创作者收益
                        </Link>
                      )}
                      {user?.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Shield className="w-4 h-4" />管理后台
                        </Link>
                      )}
                      {isRegularUser && (
                        <Link
                          to="/certification"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <FileCheck className="w-4 h-4" />认证申请
                        </Link>
                      )}
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50 w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />退出登录
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm">登录</Link>
                <Link to="/register" className="btn-primary text-xs px-3 py-1.5">注册</Link>
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 px-4 py-3 space-y-2">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </form>
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100">首页</Link>
            <Link to="/explore" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100">发现</Link>
          </div>
        )}
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">城</span>
                </div>
                <span className="text-lg font-bold text-gray-900">城事志</span>
              </div>
              <p className="text-sm text-gray-500">城市生活方式内容共创平台，记录城市点滴，分享美好生活。</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3 text-sm">快速链接</h4>
              <div className="space-y-2">
                <Link to="/explore" className="block text-sm text-gray-500 hover:text-primary-600">发现</Link>
                <Link to="/create" className="block text-sm text-gray-500 hover:text-primary-600">创作中心</Link>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3 text-sm">关于</h4>
              <p className="text-sm text-gray-500">让每一座城市的故事被看见</p>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-8 pt-4 text-center text-xs text-gray-400">
            © 2024 城事志 All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
