import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Map,
  Calculator,
  Shuffle,
  MessageSquareWarning,
  LayoutDashboard,
  Rss,
  ShieldCheck,
  Search,
  Menu,
  X,
  UserRound,
} from 'lucide-react'

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/map', label: '地图找房', icon: Map },
  { path: '/calculator', label: '购房计算器', icon: Calculator },
  { path: '/lottery/demo', label: '摇号选房', icon: Shuffle },
  { path: '/complaint', label: '黑猫投诉', icon: MessageSquareWarning },
  { path: '/my', label: '我的', icon: UserRound },
  { path: '/admin', label: '后台管理', icon: LayoutDashboard },
  { path: '/feed', label: '探盘动态', icon: Rss },
  { path: '/verify', label: '五证校验', icon: ShieldCheck },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-50 bg-brand text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 bg-gold rounded-lg flex items-center justify-center">
                <span className="text-brand font-serif font-bold text-lg">居</span>
              </div>
              <span className="font-serif text-xl font-semibold tracking-wide hidden sm:block">居易平台</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path.split('/').slice(0, 2).join('/')))
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white/15 text-gold'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center bg-white/10 rounded-lg px-3 py-1.5">
                <Search size={16} className="text-white/60" />
                <input
                  type="text"
                  placeholder="搜索楼盘、区域..."
                  className="bg-transparent border-none outline-none text-white placeholder:text-white/50 text-sm ml-2 w-40"
                />
              </div>
              <button
                className="lg:hidden text-white/80 hover:text-white p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-brand-dark border-t border-white/10 animate-slide-down">
            <div className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white/15 text-gold'
                        : 'text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="bg-brand-dark text-white/60 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center">
                  <span className="text-brand font-serif font-bold">居</span>
                </div>
                <span className="font-serif text-lg text-white">居易平台</span>
              </div>
              <p className="text-sm leading-relaxed">
                房地产垂直领域交易赋能平台，提供从信息获取到签约入住的一站式服务闭环。
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">核心服务</h4>
              <div className="space-y-2 text-sm">
                <p>楼盘信息 · 地图找房 · 购房计算器</p>
                <p>摇号选房 · 黑猫投诉 · 五证校验</p>
              </div>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">关于我们</h4>
              <div className="space-y-2 text-sm">
                <p>信息真实性校验 · 全流程服务闭环</p>
                <p>五证OCR识别 · 住建局接口核验</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-6 pt-6 text-center text-xs">
            © 2024 居易平台 - 房地产交易赋能平台
          </div>
        </div>
      </footer>
    </div>
  )
}
