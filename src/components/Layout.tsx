import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Building2,
  MessageSquare,
  LayoutDashboard,
  Settings,
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  Ticket,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: '首页', icon: Home, public: true },
    { path: '/properties', label: '房源列表', icon: Building2, public: true },
    { path: '/im', label: '咨询中心', icon: MessageSquare, public: false },
  ];

  const adminNavItems = [
    { path: '/admin/dashboard', label: '销售看板', icon: LayoutDashboard },
    { path: '/admin/properties', label: '楼盘配置', icon: Building2 },
    { path: '/admin/tickets', label: '工单处理', icon: Ticket },
    { path: '/admin/commission', label: '分佣管理', icon: Users },
  ];
  const showAdminNav = isAdmin || location.pathname.startsWith('/admin');

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-gold-400" />
                </div>
                <div>
                  <h1 className="font-serif font-bold text-xl text-primary-700">金域房产</h1>
                  <p className="text-xs text-gray-400 -mt-0.5">专业房地产交易平台</p>
                </div>
              </Link>
            </div>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                if (!item.public && !isAuthenticated) return null;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      isActive(item.path) && !isAdminRoute
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:text-primary-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
              {showAdminNav && adminNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      isActive(item.path)
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:text-primary-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 gradient-gold rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">
                        {user?.role === 'admin' ? '管理员' : user?.role === 'advisor' ? '置业顾问' : user?.role === 'agent' ? '经纪人' : '客户'}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/im');
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        我的咨询
                      </button>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/admin/dashboard');
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        管理后台
                      </button>
                      <hr className="my-2 border-gray-100" />
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-danger hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        退出登录
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/admin/dashboard" className="px-4 py-2 text-sm font-medium text-primary-700 hover:text-primary-800">
                    管理后台
                  </Link>
                  <Link to="/login" className="px-4 py-2 text-sm font-medium text-primary-700 hover:text-primary-800">
                    登录
                  </Link>
                  <Link to="/register" className="btn-secondary text-sm px-4 py-2">
                    注册
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="lg:hidden">
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
        )}
        <aside
          className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-100 z-40 transform transition-transform duration-300 lg:hidden ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              if (!item.public && !isAuthenticated) return null;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive(item.path) && !isAdminRoute
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            {showAdminNav && (
              <>
                <hr className="my-4 border-gray-100" />
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">管理后台</p>
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                        isActive(item.path)
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        </aside>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {userMenuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
      )}
    </div>
  );
}
