import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface LayoutProps {
  children: React.ReactNode
}

const RiskLevelBadge = ({ level }: { level?: number }) => {
  if (!level) return null
  
  const colors = [
    '',
    'bg-green-100 text-green-700',
    'bg-blue-100 text-blue-700',
    'bg-yellow-100 text-yellow-700',
    'bg-orange-100 text-orange-700',
    'bg-red-100 text-red-700',
  ]
  
  const names = ['', '保守型', '稳健型', '平衡型', '成长型', '激进型']
  
  return (
    <span className={`badge ${colors[level] || 'bg-gray-100 text-gray-700'}`}>
      风险等级: {names[level] || level}
    </span>
  )
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isAdmin = user && ['admin', 'compliance', 'analyst'].includes(user.role)

  const navItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/products', label: '基金产品', icon: '📊' },
    { path: '/risk-assessment', label: '风险测评', icon: '📝' },
    { path: '/orders', label: '我的订单', icon: '📋' },
    { path: '/assets', label: '我的资产', icon: '💰' },
  ]

  const adminNavItems = [
    { path: '/admin', label: '数据概览', icon: '📈' },
    { path: '/admin/orders', label: '订单管理', icon: '📋' },
    { path: '/admin/alerts', label: '合规告警', icon: '⚠️' },
    { path: '/admin/audit', label: '审计溯源', icon: '🔍' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <span className="text-xl font-bold text-gray-800">基金销售平台</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-4">
                  <RiskLevelBadge level={user.riskLevel} />
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-medium text-sm">
                        {user.fullName?.charAt(0) || user.username.charAt(0)}
                      </span>
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-700 font-medium">{user.fullName || user.username}</p>
                      <p className="text-gray-500 text-xs">{user.role === 'admin' ? '管理员' : user.role === 'compliance' ? '合规员' : user.role === 'analyst' ? '分析师' : '投资者'}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <aside className="w-56 flex-shrink-0">
            <div className="card">
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
                
                {isAdmin && (
                  <>
                    <div className="border-t border-gray-100 my-3"></div>
                    <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">管理后台</p>
                    {adminNavItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          location.pathname === item.path
                            ? 'bg-primary-50 text-primary-600'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </>
                )}
              </nav>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
