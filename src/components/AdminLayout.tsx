import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { AlertTriangle, Map, BookOpen, BarChart3, Package, ChevronLeft, Menu, X, ShieldCheck, Headphones, MapPin, ChevronDown, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

const roleDefinitions = [
  { key: 'admin', label: '运营主管', icon: ShieldCheck, color: 'bg-amber-500',
    desc: '全权限：异常预警、用户画像、知识库、网点围栏',
    nav: [
      { path: '/admin/alerts', label: '异常预警', icon: AlertTriangle },
      { path: '/admin/profiling', label: '行为画像', icon: BarChart3 },
      { path: '/admin/knowledge', label: '知识库工单', icon: BookOpen },
      { path: '/admin/networks', label: '网点围栏', icon: Map },
    ] },
  { key: 'cs', label: '客服工单', icon: Headphones, color: 'bg-sky-500',
    desc: '限权：仅知识库工单，处理用户咨询与转人工',
    nav: [
      { path: '/admin/knowledge', label: '知识库工单', icon: BookOpen },
    ] },
  { key: 'network', label: '网点管理', icon: MapPin, color: 'bg-teal-500',
    desc: '限权：仅网点围栏管理，维护服务半径与地理围栏',
    nav: [
      { path: '/admin/networks', label: '网点围栏', icon: Map },
    ] },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [roleKey, setRoleKey] = useState('admin')
  const [showRoleMenu, setShowRoleMenu] = useState(false)

  const currentRole = roleDefinitions.find((r) => r.key === roleKey) || roleDefinitions[0]
  const navItems = currentRole.nav
  const firstNavPath = navItems[0]?.path || '/admin/alerts'

  const handleSwitchRole = (key: string) => {
    const role = roleDefinitions.find((r) => r.key === key)
    setRoleKey(key)
    setShowRoleMenu(false)
    setSidebarOpen(false)
    if (role) navigate(role.nav[0]?.path || '/admin/alerts')
  }

  return (
    <div className="min-h-screen bg-surface flex">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-navy transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-white text-lg font-bold">运营后台</span>
          </Link>
          <button className="lg:hidden text-white/60 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-3 py-3 border-b border-white/10">
          <div className="relative">
            <button onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 ${currentRole.color} rounded-lg flex items-center justify-center`}>
                  <currentRole.icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium leading-tight">{currentRole.label}</p>
                  <p className="text-[10px] text-white/50 leading-tight">当前角色</p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${showRoleMenu ? 'rotate-180' : ''}`} />
            </button>
            {showRoleMenu && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-navy-dark border border-white/10 rounded-lg p-1.5 z-50 animate-fade-in shadow-2xl">
                {roleDefinitions.map((role) => {
                  const Icon = role.icon
                  const isActive = roleKey === role.key
                  return (
                    <button key={role.key} onClick={() => handleSwitchRole(role.key)}
                      className={`w-full flex items-start gap-2.5 p-2 rounded-lg transition-all ${
                        isActive ? 'bg-accent/20 border border-accent/30' : 'hover:bg-white/5'
                      }`}>
                      <div className={`w-7 h-7 ${role.color} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-white">{role.label}</p>
                          {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-accent" />}
                        </div>
                        <p className="text-[10px] text-white/50 mt-0.5 leading-snug">{role.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-accent text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2 text-white/50 hover:text-white/80 text-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            返回C端首页
          </Link>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-14 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden text-gray-500 hover:text-gray-700"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="font-display text-navy text-lg font-bold">
                {navItems.find((i) => i.path === location.pathname)?.label || '运营管理'}
              </h1>
              <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-white ${currentRole.color}`}>
                <currentRole.icon className="w-3 h-3" />
                {currentRole.label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-navy">
                  {roleKey === 'admin' ? '李运营' : roleKey === 'cs' ? '王客服' : '赵网点'}
                </p>
                <p className="text-[10px] text-text-lighter">工号{roleKey === 'admin' ? 'OP001' : roleKey === 'cs' ? 'CS002' : 'NW003'}</p>
              </div>
              <div className={`w-8 h-8 ${currentRole.color} rounded-full flex items-center justify-center`}>
                <span className="text-white text-sm font-bold">
                  {roleKey === 'admin' ? '李' : roleKey === 'cs' ? '王' : '赵'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
