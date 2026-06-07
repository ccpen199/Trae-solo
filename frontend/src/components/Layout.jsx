import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/', label: '首页' },
    { to: '/tasks', label: '任务大厅' },
    { to: '/publish', label: '发布悬赏' },
    { to: '/ranking', label: '排行榜' },
    { to: '/red-packet', label: '红包活动' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">赏</span>
                </div>
                <span className="text-xl font-bold text-gray-900">众包悬赏平台</span>
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div className="hidden sm:flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-amber-700">{user.balance != null ? `¥${Number(user.balance).toFixed(2)}` : '¥0.00'}</span>
                  </div>
                  <Link
                    to="/profile"
                    className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    {user.nickname || user.username}
                  </Link>
                  <Link
                    to="/profile"
                    className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    个人中心
                  </Link>
                  {user.is_admin && (
                    <Link
                      to="/admin"
                      className="px-3 py-1.5 rounded-md text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 transition-colors"
                    >
                      管理后台
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    退出
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    登录
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    注册
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">赏</span>
              </div>
              <span className="text-sm font-semibold text-gray-700">众包悬赏平台</span>
            </div>
            <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} 众包悬赏平台 - 安全可靠的任务服务平台</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
