import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Clock,
  BarChart3,
  LogOut,
  LogIn,
  User,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api';

const menuItems = [
  {
    path: '/dashboard',
    icon: LayoutDashboard,
    label: '工作台',
  },
  {
    path: '/services',
    icon: FileText,
    label: '事项中心',
  },
  {
    path: '/licenses',
    icon: CreditCard,
    label: '亮证中心',
  },
  {
    path: '/applications',
    icon: Clock,
    label: '办件进度',
  },
  {
    path: '/monitor',
    icon: BarChart3,
    label: '效能监测',
    roles: ['admin', 'operator'],
  },
];

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, setAuth } = useAuthStore();

  const enterDemoWorkspace = (targetPath: string) => {
    setAuth('local-demo-admin-token', {
      id: 1,
      name: '演示管理员',
      idCard: '340000199001010001',
      phone: '13800000000',
      email: 'demo-admin@example.com',
      userType: 'natural',
      roles: ['admin', 'operator'],
    });
    navigate(targetPath);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
    logout();
    navigate('/login');
  };

  const hasPermission = (item: typeof menuItems[0]) => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.some((r) => user.roles?.includes(r));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Building2 className="w-8 h-8 text-primary-600" />
          <span className="ml-3 font-bold text-lg text-gray-900">
            安徽省政务服务
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.filter(hasPermission).map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="ml-3">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          {user ? (
            <>
              <div className="flex items-center px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.roles?.includes('admin') ? '管理员' : user?.userType === 'natural' ? '自然人' : '法人用户'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="ml-3">个人中心</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="ml-3">退出登录</span>
              </button>
            </>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => enterDemoWorkspace('/dashboard')}
                className="w-full flex items-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <LogIn className="w-5 h-5" />
                <span className="ml-3">登录个人中心</span>
              </button>
              <button
                onClick={() => enterDemoWorkspace('/applications')}
                className="w-full flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Clock className="w-5 h-5" />
                <span className="ml-3">我的办件</span>
              </button>
              <button
                onClick={() => enterDemoWorkspace('/monitor')}
                className="w-full flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
                <span className="ml-3">后台管理</span>
              </button>
            </div>
          )}
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {menuItems.find((m) => location.pathname.startsWith(m.path))?.label || '安徽省一体化政务服务平台'}
            </h1>
            <p className="text-sm text-gray-500">省级工作台</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
