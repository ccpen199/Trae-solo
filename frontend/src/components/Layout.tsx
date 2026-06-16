import React from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Avatar, Badge, Icon } from './ui';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const navItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/feed', label: '动态', icon: '📰' },
    { path: '/merchants', label: '周边', icon: '🏪' },
    { path: '/help', label: '互助', icon: '🤝' },
    { path: '/utilities', label: '便民', icon: '🛠️' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg">
                邻
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                邻里圈
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/create')}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg text-sm font-medium hover:from-primary-600 hover:to-primary-700 transition-all shadow-md shadow-primary-500/25"
              aria-label="发布"
            >
              <Icon name="plus" className="text-base" />
              发布
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                {(user.role === 'ADMIN' || user.role === 'GOVERNMENT') && (
                  <Link
                    to="/admin"
                    className="px-3 py-1.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                  >
                    后台管理
                  </Link>
                )}
                <button
                  onClick={() => navigate('/profile')}
                  className="px-3 py-1.5 text-xs font-medium bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  个人中心
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors"
                >
                  <Avatar src={user.avatar} name={user.nickname} size="sm" />
                  <span className="hidden sm:inline text-sm font-medium text-gray-700">
                    {user.nickname}
                  </span>
                </button>
                <button
                  onClick={logout}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  退出
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/admin')}
                  className="hidden sm:inline-flex px-3 py-2 text-sm font-medium text-amber-700 hover:text-amber-900"
                >
                  后台管理
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className="hidden sm:inline-flex px-3 py-2 text-sm font-medium text-primary-700 hover:text-primary-900"
                >
                  个人中心
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  登录
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  注册
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 pb-24 md:pb-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-3 text-xs ${
                isActive(item.path) ? 'text-primary-600' : 'text-gray-500'
              }`}
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
        <button
          onClick={() => navigate('/create')}
          aria-label="发布"
          className="md:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white text-2xl shadow-lg shadow-primary-500/40 flex items-center justify-center"
        >
          发布
        </button>
      </nav>
    </div>
  );
};

export default MainLayout;
