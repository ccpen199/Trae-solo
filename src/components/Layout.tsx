import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Home, ClipboardCheck, Plug, BarChart3, Shield } from 'lucide-react'
import CitySelector from './CitySelector'

export default function Layout() {
  const location = useLocation()

  const navItems = [
    { to: '/', label: '办事大厅', icon: Home },
    { to: '/services', label: '便民服务', icon: Plug },
    { to: '/review', label: '内容审核', icon: ClipboardCheck, adminOnly: true },
    { to: '/analytics', label: '运营分析', icon: BarChart3, adminOnly: true },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-government-600 via-government-500 to-government-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2">
                <Shield className="w-8 h-8" />
                <div>
                  <h1 className="text-lg font-bold leading-tight">城市生活服务知识图谱</h1>
                  <p className="text-xs text-white/70 leading-tight">City Life Service Knowledge Graph</p>
                </div>
              </Link>
              <CitySelector />
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.to
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white font-medium'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </nav>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-sm">
                <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-xs font-medium">
                  张
                </div>
                <span className="text-sm">张编辑</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="md:hidden bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-thin py-2 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.to
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{item.label}</span>
                </NavLink>
              )
            })}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      <footer className="bg-gray-800 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 text-white mb-3">
                <Shield className="w-5 h-5" />
                <span className="font-bold">城市生活服务知识图谱平台</span>
              </div>
              <p className="text-sm">以结构化办事指南为核心资产，为市民提供权威、准确、便捷的政务服务查询。</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">服务支持</h4>
              <ul className="space-y-2 text-sm">
                <li>服务热线：12345</li>
                <li>工作时间：周一至周五 9:00-17:00</li>
                <li>意见反馈：feedback@gov.cn</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">友情链接</h4>
              <ul className="space-y-2 text-sm">
                <li>国家政务服务平台</li>
                <li>各省政务服务网</li>
                <li>数据开放平台</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-6 pt-6 text-center text-xs">
            © 2026 全国城市生活服务知识图谱平台 版权所有 | 京ICP备12345678号
          </div>
        </div>
      </footer>
    </div>
  )
}
