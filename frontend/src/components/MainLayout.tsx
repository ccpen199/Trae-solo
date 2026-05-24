import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, useAlertStore } from '../store';
import {
  LayoutDashboard,
  Watch,
  Target,
  Dumbbell,
  Activity,
  Bell,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { unreadCount, refreshUnreadCount } = useAlertStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userNavItems = [
    { path: '/', label: '仪表盘', icon: LayoutDashboard },
    { path: '/devices', label: '设备管理', icon: Watch },
    { path: '/goals', label: '目标管理', icon: Target },
    { path: '/plans', label: '训练计划', icon: Dumbbell },
    { path: '/workouts', label: '运动记录', icon: Activity },
    { path: '/alerts', label: '异常提醒', icon: Bell }
  ];

  const coachNavItems = [
    { path: '/coach', label: '教练工作台', icon: Users },
    { path: '/alerts', label: '异常提醒', icon: Bell }
  ];

  const adminNavItems = [
    { path: '/admin', label: '运营看板', icon: BarChart3 },
    { path: '/admin/logs', label: '操作日志', icon: Settings },
    { path: '/admin/reports', label: '数据报表', icon: BarChart3 }
  ];

  const getNavItems = () => {
    if (!user) return userNavItems;
    if (user.role === 'coach' || user.role === 'advisor') {
      return [...userNavItems, ...coachNavItems];
    }
    if (user.role === 'admin') {
      return [...userNavItems, ...coachNavItems, ...adminNavItems];
    }
    return userNavItems;
  };

  const navItems = getNavItems();

  const roleNames: Record<string, string> = {
    user: '普通用户',
    coach: '教练',
    advisor: '健康顾问',
    admin: '系统管理员'
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen && (
            <h1 className="text-lg font-bold text-primary-600">健康运动平台</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                {sidebarOpen && item.path === '/alerts' && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {navItems.find((n) => location.pathname.startsWith(n.path) || n.path === '/' && location.pathname === '/')?.label || '健康运动数据平台'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/alerts')}
              className="relative p-2 rounded-lg hover:bg-gray-100"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
              >
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                  {user?.name?.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                  <p className="text-xs text-gray-500">{roleNames[user?.role || 'user']}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
