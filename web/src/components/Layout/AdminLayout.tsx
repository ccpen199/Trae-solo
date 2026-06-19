import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../../store/auth';

interface AdminLayoutProps {
  role: 'property' | 'operator';
}

const propertyMenu = [
  { to: '/property/dashboard', label: '看板', icon: '📊' },
  { to: '/property/devices', label: '设备监控', icon: '📡' },
  { to: '/property/workorders', label: '工单管理', icon: '🔧' }
];

const operatorMenu = [
  { to: '/operator/dashboard', label: '总览', icon: '📈' },
  { to: '/operator/heatmap', label: '热力图', icon: '🔥' },
  { to: '/operator/analytics', label: '数据分析', icon: '📉' },
  { to: '/operator/packages', label: '套餐管理', icon: '💎' },
  { to: '/operator/devices', label: '设备管理', icon: '🗂️' }
];

const AdminLayout = ({ role }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const menu = role === 'property' ? propertyMenu : operatorMenu;
  const title = role === 'property' ? '物业管理后台' : '运营管理后台';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-full bg-gray-100">
      <aside
        className={`${
          collapsed ? 'w-16' : 'w-56'
        } bg-gray-900 text-white flex flex-col transition-all duration-300`}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-800 px-4">
          {!collapsed && (
            <h1 className="text-lg font-semibold truncate">{title}</h1>
          )}
          {collapsed && <span className="text-2xl">🏢</span>}
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 mx-2 rounded-lg mb-1 transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              {!collapsed && <span className="ml-3">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-800 p-3">
          <div className="flex items-center">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {collapsed ? '→' : '←'}
            </button>
            {!collapsed && user && (
              <div className="ml-2 flex items-center justify-between flex-1">
                <div className="overflow-hidden">
                  <div className="text-sm font-medium truncate">{user.nickname}</div>
                  <div className="text-xs text-gray-400 truncate">{user.phone}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded transition-colors"
                >
                  退出
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
          <div className="text-gray-600">
            欢迎回来，<span className="font-medium text-gray-800">{user?.nickname || '管理员'}</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-gray-500 hover:text-gray-700 transition-colors">
              🔔
            </button>
            <button
              onClick={() => navigate('/home')}
              className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
            >
              返回居民端
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
