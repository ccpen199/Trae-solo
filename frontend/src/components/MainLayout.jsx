import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function MainLayout() {
  const { user, logout, getRoleConfig } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const config = getRoleConfig(user?.role);
  const menus = config?.menus || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          {sidebarOpen ? (
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{config?.icon || '🏠'}</span>
              <span className="font-bold text-lg text-gray-900">海尔智家</span>
            </div>
          ) : (
            <span className="text-2xl mx-auto">{config?.icon || '🏠'}</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menus.map((menu) => (
            <Link
              key={menu.path}
              to={menu.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                location.pathname === menu.path
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-lg">{menu.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{menu.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <span className="text-lg">🚪</span>
            {sidebarOpen && <span className="text-sm font-medium">退出登录</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {menus.find(m => m.path === location.pathname)?.label || '海尔智家'}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-gray-600 text-xl">🔔</button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">{user?.name || user?.username}</div>
                <div className="text-gray-500 text-xs">{config?.label}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
