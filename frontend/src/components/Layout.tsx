import { NavLink } from 'react-router-dom'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const navItems = [
    { path: '/mortgage', label: '房贷计算', icon: '🏠' },
    { path: '/tax', label: '个税计算', icon: '💰' },
    { path: '/knowledge', label: '购房知识库', icon: '📚' },
    { path: '/policy', label: '政策中心', icon: '📋' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🏡</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">购房者金融决策平台</h1>
                <p className="text-xs text-gray-500">专业房贷 · 个税 · 购房知识一站式服务</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-1">
              {navItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <nav className="md:hidden bg-white border-b border-gray-200 px-4 py-2 overflow-x-auto">
        <div className="flex space-x-2">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 bg-gray-50'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>本平台计算结果仅供参考，实际以银行及税务部门核定为准</p>
            <p className="mt-1">购房者金融决策支持平台 © 2025</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
