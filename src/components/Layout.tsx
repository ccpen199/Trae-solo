import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Home, Search, Building2, User, Calculator, FileText, Settings, LogOut, Menu, X, Shield, Palette, Navigation, PlusCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/properties', label: '房源搜索', icon: Search },
    { path: '/map-search', label: '地图找房', icon: Navigation },
    { path: '/agents', label: '经纪人', icon: User },
    { path: '/mortgage-calculator', label: '房贷计算', icon: Calculator },
    { path: '/decoration-plans', label: '装修方案', icon: Palette },
    { path: '/publish', label: '发布房源', icon: PlusCircle },
    { path: '/appeal', label: '下架申诉', icon: AlertCircle },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', label: '管理后台', icon: Shield });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <Link to="/" className="flex items-center ml-4">
                <Building2 className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">优居房产</span>
              </Link>
            </div>

            <nav className="hidden lg:flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                >
                  <item.icon size={18} className="mr-2" />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700">
                    {user.real_name || user.username}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut size={18} className="mr-1" />
                    退出
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  登录
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div
        className={cn(
          'fixed inset-0 z-30 lg:hidden transition-opacity',
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div
          className={cn(
            'absolute left-0 top-16 h-full w-64 bg-white shadow-lg transition-transform',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center px-4 py-3 rounded-md text-gray-700 hover:bg-gray-100"
              >
                <item.icon size={20} className="mr-3" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children || <Outlet />}
      </main>

      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Building2 className="h-8 w-8 text-blue-400" />
                <span className="ml-2 text-xl font-bold">优居房产</span>
              </div>
              <p className="text-gray-400 text-sm">
                专业级房地产全周期服务平台，覆盖新房、二手房、租赁、商业地产四大业务线。
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">业务范围</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>新房买卖</li>
                <li>二手房交易</li>
                <li>房屋租赁</li>
                <li>商业地产</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">服务支持</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>房贷计算器</li>
                <li>看房笔记</li>
                <li>装修方案</li>
                <li>帮助中心</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">联系我们</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>客服热线: 400-888-8888</li>
                <li>邮箱: service@youju.com</li>
                <li>工作时间: 9:00 - 21:00</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
            © 2024 优居房产 版权所有
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
