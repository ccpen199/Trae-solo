import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { getBeanBalance, updateLocation } from '../api/client'
import { useApp } from '../context/AppContext'

interface NavItem {
  to: string
  label: string
  icon: string
  roles: string[]
  section: string
}

const allNavItems: NavItem[] = [
  { to: '/', label: '工作台', icon: '🏠', roles: ['user', 'creator', 'admin'], section: '主菜单' },
  { to: '/news/nearby', label: '附近热点', icon: '📍', roles: ['user', 'creator', 'admin'], section: '主菜单' },
  { to: '/news', label: '资讯中心', icon: '📰', roles: ['user', 'creator', 'admin'], section: '主菜单' },
  { to: '/videos', label: '视频内容', icon: '🎬', roles: ['user', 'creator', 'admin'], section: '主菜单' },
  { to: '/creators', label: '创作者中心', icon: '✨', roles: ['creator', 'admin'], section: '创作者' },
  { to: '/news', label: '发布内容', icon: '📝', roles: ['creator', 'admin'], section: '创作者' },
  { to: '/admin', label: '运营大屏', icon: '📊', roles: ['admin'], section: '运营管理' },
  { to: '/admin/reports', label: '内容审核', icon: '🔍', roles: ['admin'], section: '运营管理' },
  { to: '/admin/creators', label: '创作者管理', icon: '👥', roles: ['admin'], section: '运营管理' },
  { to: '/admin/anti-fraud', label: '反欺诈监控', icon: '🛡️', roles: ['admin'], section: '运营管理' },
  { to: '/tasks', label: '任务中心', icon: '🎯', roles: ['user', 'creator', 'admin'], section: '任务奖励' },
  { to: '/beans', label: '里里豆', icon: '🫘', roles: ['user', 'creator', 'admin'], section: '任务奖励' },
]

const roleInfo: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  user: { label: '资讯用户', color: 'text-orange-600', bg: 'bg-orange-100', icon: '📰' },
  creator: { label: '创作者', color: 'text-blue-600', bg: 'bg-blue-100', icon: '✨' },
  admin: { label: '管理员', color: 'text-gray-600', bg: 'bg-gray-100', icon: '⚙️' },
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [beanBalance, setBeanBalance] = useState(0)
  const navigate = useNavigate()
  const { user, location, deviceFingerprint, refreshLocation, logout, showToast, toast } = useApp()

  const userRole = user?.role || 'user'
  const role = roleInfo[userRole] || roleInfo.user

  const filteredNav = allNavItems.filter((item) => item.roles.includes(userRole))
  const sections = [...new Set(filteredNav.map((item) => item.section))]

  useEffect(() => {
    getBeanBalance()
      .then((res) => setBeanBalance(res.data?.balance ?? 0))
      .catch(() => {})
  }, [])

  const handleRefreshLocation = async () => {
    const result = await refreshLocation()
    if (result && location) {
      try {
        await updateLocation({ latitude: location.lat, longitude: location.lng, accuracy: location.accuracy })
        showToast('位置已同步到服务器', 'success')
      } catch {
        showToast('位置同步失败，请重试', 'error')
      }
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    showToast('已安全退出登录', 'info')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {toast.visible && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-green-500 text-white'
                : toast.type === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-blue-500 text-white'
            }`}
          >
            <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-primary to-orange-700 text-white transform transition-transform duration-300 lg:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-white/20">
          <h1 className="text-2xl font-bold tracking-wide">里里</h1>
          <div className="mt-2">
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${role.bg} ${role.color}`}>
              <span>{role.icon}</span>
              <span>{role.label}</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
          {sections.map((section) => (
            <div key={section} className="mb-4">
              <div className="px-5 py-1 text-xs font-semibold text-orange-200 uppercase tracking-wider">
                {section}
              </div>
              {filteredNav
                .filter((item) => item.section === section)
                .map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-5 py-2.5 mx-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-white/20 text-white font-semibold shadow-sm'
                          : 'text-orange-100 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">
              {role.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.nickname || user?.username || '用户'}</p>
              <NavLink to="/beans" className="text-xs text-orange-200 hover:text-white">
                🫘 {beanBalance} 里里豆 → 兑换
              </NavLink>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-orange-200 mb-3">
            <span className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  location?.status === 'granted' ? 'bg-green-400' : location?.status === 'pending' ? 'bg-yellow-400' : 'bg-gray-400'
                }`}
              ></span>
              <span
                title={location ? `${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}${location.accuracy ? ` (±${Math.round(location.accuracy)}m)` : ''}` : '定位'}
              >
                {location?.status === 'granted'
                  ? '已定位'
                  : location?.status === 'pending'
                  ? '定位中...'
                  : '未定位'}
              </span>
            </span>
            <span title="设备指纹">{deviceFingerprint ? '🔒' : '🔓'}</span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full text-sm text-orange-200 hover:text-white py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            退出登录
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="animate-pulse-dot inline-block w-2 h-2 rounded-full bg-green-500"></span>
              <span>
                📍{' '}
                {location
                  ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}${location.accuracy ? ` (±${Math.round(location.accuracy)}m)` : ''}`
                  : '定位中...'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleRefreshLocation}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary transition-colors"
              title="刷新位置"
            >
              <span>📍</span>
              <span className="text-xs hidden sm:inline">刷新位置</span>
            </button>
            <NavLink
              to="/beans"
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary transition-colors"
            >
              <span>🫘</span>
              <span className="font-semibold">{beanBalance}</span>
            </NavLink>
            <span className="text-sm text-gray-400">🔔</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin p-4 lg:p-6">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
