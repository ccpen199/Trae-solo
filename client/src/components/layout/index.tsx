import React, { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { UserRole } from '../../types';

interface LayoutProps {
  children: ReactNode;
}

const roleNavItems: Record<string, Array<{ path: string; label: string; icon: string }>> = {
  [UserRole.TOURIST]: [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/tours', label: '旅游线路', icon: '🗺️' },
    { path: '/my-orders', label: '我的订单', icon: '📋' },
    { path: '/profile', label: '个人中心', icon: '👤' },
  ],
  [UserRole.SALES]: [
    { path: '/', label: '仪表盘', icon: '📊' },
    { path: '/tours', label: '线路管理', icon: '🗺️' },
    { path: '/groups', label: '团期管理', icon: '📅' },
    { path: '/orders', label: '订单管理', icon: '📋' },
    { path: '/settlements', label: '结算管理', icon: '💰' },
    { path: '/statistics', label: '数据统计', icon: '📈' },
  ],
  [UserRole.GUIDE]: [
    { path: '/guide/tasks', label: '我的任务', icon: '📋' },
    { path: '/guide/reports', label: '行程上报', icon: '📝' },
    { path: '/profile', label: '个人中心', icon: '👤' },
  ],
  [UserRole.ADMIN]: [
    { path: '/', label: '仪表盘', icon: '📊' },
    { path: '/tours', label: '线路管理', icon: '🗺️' },
    { path: '/groups', label: '团期管理', icon: '📅' },
    { path: '/orders', label: '订单管理', icon: '📋' },
    { path: '/users', label: '用户管理', icon: '👥' },
    { path: '/settlements', label: '结算管理', icon: '💰' },
    { path: '/statistics', label: '数据统计', icon: '📈' },
  ],
  [UserRole.AGENCY]: [
    { path: '/', label: '仪表盘', icon: '📊' },
    { path: '/tours', label: '线路管理', icon: '🗺️' },
    { path: '/groups', label: '团期管理', icon: '📅' },
    { path: '/orders', label: '订单管理', icon: '📋' },
    { path: '/settlements', label: '结算管理', icon: '💰' },
  ],
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = user ? roleNavItems[user.role] || [] : [];

  if (!isAuthenticated) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-600">
            🌍 旅游预订系统
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {user?.role === UserRole.TOURIST ? '游客端' :
             user?.role === UserRole.SALES ? '销售端' :
             user?.role === UserRole.GUIDE ? '导游端' :
             user?.role === UserRole.AGENCY ? '地接社端' : '管理端'}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${
                  isActive ? 'nav-link-active' : 'nav-link-inactive'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.username}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full btn btn-secondary justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            退出登录
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

export const PublicLayout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <span className="text-2xl mr-2">🌍</span>
              <span className="text-xl font-bold text-primary-600">旅游预订系统</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-600 hover:text-primary-600 font-medium">
                首页
              </Link>
              <Link to="/tours" className="text-gray-600 hover:text-primary-600 font-medium">
                旅游线路
              </Link>
              {isAuthenticated && (
                <Link to="/my-orders" className="text-gray-600 hover:text-primary-600 font-medium">
                  我的订单
                </Link>
              )}
            </nav>

            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <Link to="/profile" className="flex items-center text-gray-600 hover:text-primary-600">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium text-sm">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <span className="ml-2 text-sm font-medium">{user?.name}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-500 hover:text-red-600"
                  >
                    退出
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-gray-600 hover:text-primary-600"
                  >
                    登录
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary text-sm"
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="bg-gray-800 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">关于我们</h3>
              <p className="text-gray-400 text-sm">
                专业的旅游线路预订平台，为您提供优质的旅游服务。
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">热门目的地</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>北京</li>
                <li>云南</li>
                <li>海南</li>
                <li>更多...</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">客户服务</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>帮助中心</li>
                <li>退改政策</li>
                <li>常见问题</li>
                <li>联系我们</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">联系方式</h3>
              <div className="text-gray-400 text-sm space-y-2">
                <p>📞 400-123-4567</p>
                <p>📧 service@tour.com</p>
                <p>🕐 9:00 - 21:00</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>© 2024 旅游线路预订系统. 保留所有权利.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
