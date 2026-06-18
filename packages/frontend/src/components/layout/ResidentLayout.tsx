import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import {
  Home,
  MessageSquare,
  ShoppingBag,
  Repeat,
  Wallet,
  Store,
  Building2,
  Search,
  Bell,
  User,
  LogOut,
  Menu,
  Shield,
  Settings,
  FileText,
  MapPin,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { getRoleLabel } from '@/mock/auth';
import clsx from 'clsx';

const navItems = [
  { to: '/', icon: Home, label: '首页' },
  { to: '/topics', icon: MessageSquare, label: '邻里话题' },
  { to: '/products', icon: ShoppingBag, label: '邻里优选' },
  { to: '/secondhand', icon: Repeat, label: '二手交易' },
  { to: '/wallet', icon: Wallet, label: '小金库' },
  { to: '/partner', icon: Store, label: '合作开店' },
  { to: '/property', icon: Building2, label: '物业服务' },
  { to: '/orders', icon: FileText, label: '我的订单' },
];

const roleBadgeColors: Record<string, string> = {
  platform_admin: 'bg-purple-100 text-purple-700',
  tenant_admin: 'bg-blue-100 text-blue-700',
  property_admin: 'bg-green-100 text-green-700',
  property_staff: 'bg-orange-100 text-orange-700',
  resident: 'bg-indigo-100 text-indigo-700',
};

export default function ResidentLayout() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'platform_admin' || user?.role === 'tenant_admin';
  const isProperty = user?.role === 'property_admin' || user?.role === 'property_staff';

  const communityName =
    (user as { communityName?: string } | null)?.communityName || '邻里数字基座';
  const subdomain =
    (user as { subdomain?: string } | null)?.subdomain || 'default';

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-30 w-56 bg-white border-r border-gray-200 transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-16 flex items-center px-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-emerald-500 flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div className="ml-2">
            <span className="font-bold text-gray-800 text-sm">邻里数字基座</span>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="w-3 h-3" />
              {communityName}
            </div>
          </div>
        </div>

        <div className="px-3 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">
                {user?.nickname || '住户'}
              </div>
              <span
                className={clsx(
                  'text-xs px-1.5 py-0.5 rounded',
                  roleBadgeColors[user?.role || 'resident']
                )}
              >
                {getRoleLabel(user?.role || 'resident')}
              </span>
            </div>
          </div>
        </div>

        <nav className="mt-2 px-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {(isAdmin || isProperty) && (
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100">
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <Shield className="w-4 h-4" />
                进入管理后台
              </button>
            )}
            {isProperty && (
              <button
                onClick={() => navigate('/property/dashboard')}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 transition-colors"
              >
                <Building2 className="w-4 h-4" />
                物业工作台
              </button>
            )}
          </div>
        )}
      </aside>

      <div className={clsx('flex-1 lg:ml-56')}>
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-sm text-gray-500">
                社区子域：
              </span>
              <span className="text-sm font-mono text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                {subdomain}.neighborhood.cn
              </span>
            </div>
            <div className="relative hidden md:block ml-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索社区内容、商品、邻居..."
                className="pl-9 pr-4 py-2 w-72 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-gray-100">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-emerald-400 flex items-center justify-center text-white font-bold text-sm">
                  {(user?.realName || user?.nickname || '住').charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-700">
                    {user?.nickname || '住户'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {getRoleLabel(user?.role || 'resident')}
                  </div>
                </div>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="font-medium text-gray-800">
                      {user?.nickname || '住户'}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {user?.phone}
                    </div>
                    <span
                      className={clsx(
                        'inline-block mt-2 text-xs px-2 py-0.5 rounded',
                        roleBadgeColors[user?.role || 'resident']
                      )}
                    >
                      {getRoleLabel(user?.role || 'resident')}
                    </span>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User className="w-4 h-4" />
                    个人资料
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="w-4 h-4" />
                    账号设置
                  </Link>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/admin');
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50"
                    >
                      <Shield className="w-4 h-4" />
                      管理后台
                    </button>
                  )}
                  {isProperty && (
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/property/dashboard');
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                    >
                      <Building2 className="w-4 h-4" />
                      物业工作台
                    </button>
                  )}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}
