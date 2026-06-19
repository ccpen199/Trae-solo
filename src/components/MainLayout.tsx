import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { getMenuByRole } from '@/config/menu'
import { useBusinessStore } from '@/store/business'
import Modal from './Modal'
import RoleSwitcher from './RoleSwitcher'
import {
  Leaf,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Menu,
  X,
  Users,
  Building2,
  Shield,
  SwitchCamera,
  Sparkles,
} from 'lucide-react'

export default function MainLayout() {
  const { user, logout } = useAuthStore()
  const { addToast, openModal } = useBusinessStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [roleSwitchOpen, setRoleSwitchOpen] = useState(false)

  if (!user) return null

  const menuItems = getMenuByRole(user.role)
  const roleNames: Record<string, string> = {
    direct_seller: '直销员',
    store_owner: '生活馆店主',
    hq_admin: '总部运营',
  }

  const roleIcons: Record<string, typeof Users> = {
    direct_seller: Users,
    store_owner: Building2,
    hq_admin: Shield,
  }

  const handleLogout = () => {
    logout()
    addToast({ type: 'info', title: '已退出登录', description: '期待您的下次使用' })
    navigate('/login', { replace: true })
  }

  const handleNavigate = (path: string, label?: string) => {
    navigate(path)
    setMenuOpen(false)
    if (label) {
      addToast({ type: 'info', title: `进入${label}`, description: '页面已加载完成' })
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    addToast({ type: 'info', title: '搜索功能', description: '正在搜索客户、产品、订单...' })
  }

  const RoleIcon = roleIcons[user.role]

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 侧边栏 */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white transform transition-transform duration-300 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div className="ml-3">
            <div className="font-bold text-sm">新时代健康</div>
            <div className="text-[11px] text-white/50">展业协同平台</div>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="lg:hidden ml-auto text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center font-bold">
                  {user.name.charAt(0)}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{user.name}</div>
                <div className="text-xs text-white/50 flex items-center gap-1">
                  <RoleIcon className="w-3 h-3" />
                  {roleNames[user.role]}
                </div>
              </div>
            </div>
            {user.level && (
              <div className="mt-3 px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-md text-center border border-emerald-500/30 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" />
                {user.level}
              </div>
            )}
            <div className="mt-2 text-xs text-white/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {user.region}
            </div>
            {/* 角色切换按钮 */}
            <button
              onClick={() => {
                setRoleSwitchOpen(true)
                setMenuOpen(false)
              }}
              className="mt-3 w-full py-2 text-xs font-medium text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center gap-1.5 transition group"
            >
              <SwitchCamera className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
              切换角色视角
            </button>
          </div>
        </div>

        <nav className="px-3 pb-4 space-y-1 overflow-y-auto max-h-[calc(100vh-320px)]">
          <div className="px-2 py-1.5 text-[10px] uppercase text-white/30 font-semibold tracking-wider">
            业务导航
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
            return (
              <button
                key={item.key}
                onClick={() => handleNavigate(item.path, item.label)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-white/70 hover:text-white hover:bg-white/5 active:scale-[0.98]'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                <span className="flex-1 text-left font-medium">{item.label}</span>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badge === '告警'
                        ? 'bg-red-500/20 text-red-300 animate-pulse'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10 bg-slate-900/50 backdrop-blur">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </aside>

      {/* 遮罩 */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* 顶部栏 */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 flex items-center px-4 lg:px-6 gap-3">
          <button
            onClick={() => setMenuOpen(true)}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg -ml-2"
          >
            <Menu className="w-5 h-5" />
          </button>

          <form className="hidden md:flex items-center flex-1 max-w-xl" onSubmit={handleSearch}>
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition" />
              <input
                type="text"
                placeholder="搜索客户姓名、产品、订单号..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition placeholder:text-slate-400"
              />
            </div>
          </form>

          <div className="flex-1 md:hidden" />

          {/* 角色快速切换 */}
          <button
            onClick={() => setRoleSwitchOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-emerald-50 hover:to-teal-50 border border-slate-200 hover:border-emerald-200 rounded-lg text-xs font-medium text-slate-700 transition group"
          >
            <RoleIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>{roleNames[user.role]}</span>
            <ChevronDown className="w-3 h-3 group-hover:rotate-180 transition" />
          </button>

          <div className="flex items-center gap-1">
            <button
              className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition group"
              onClick={() => addToast({ type: 'info', title: '消息中心', description: '您有 3 条未读消息' })}
            >
              <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </button>

            <div className="relative ml-1">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded-lg transition pr-2"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm shadow">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-slate-800">{user.name}</div>
                  <div className="text-[11px] text-slate-500">{roleNames[user.role]}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-800 truncate">{user.name}</div>
                          <div className="text-xs text-slate-500 truncate">{user.phone}</div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        openModal('account_settings', { initialTab: 'profile' })
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                    >
                      <User className="w-4 h-4" />
                      个人资料
                    </button>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        setRoleSwitchOpen(true)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                    >
                      <SwitchCamera className="w-4 h-4" />
                      切换角色视角
                    </button>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        openModal('account_settings', { initialTab: 'security' })
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Settings className="w-4 h-4" />
                      账号设置
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        handleLogout()
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* 内容区 */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* 角色切换弹窗 */}
      <Modal
        open={roleSwitchOpen}
        onClose={() => setRoleSwitchOpen(false)}
        title="切换工作台视角"
        subtitle="体验不同角色的完整业务流程"
        size="md"
      >
        <RoleSwitcher onClose={() => setRoleSwitchOpen(false)} />
      </Modal>
    </div>
  )
}
