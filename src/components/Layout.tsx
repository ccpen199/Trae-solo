import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store';
import {
  Home,
  FileText,
  Building2,
  ShoppingCart,
  CreditCard,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/demands', label: '需求管理', icon: FileText },
    { path: '/enterprises', label: '企业管理', icon: Building2 },
    { path: '/quotes', label: '报价管理', icon: ShoppingCart },
    { path: '/orders', label: '订单管理', icon: ShoppingCart },
    { path: '/account', label: '账户中心', icon: CreditCard },
  ];

  if (!isAuthenticated) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50 h-16">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-xl font-bold text-blue-600">OKODM</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.real_name || user?.username}
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
              {user?.role === 'buyer' ? '采购商' : user?.role === 'supplier' ? '供应商' : user?.role === 'manager' ? '项目经理' : '管理员'}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-gray-600 hover:text-red-600"
            >
              <LogOut size={18} />
              <span className="text-sm">退出</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        <aside
          className={`bg-white shadow-sm fixed left-0 top-16 bottom-0 transition-all duration-300 z-40 ${
            sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
          }`}
        >
          <div className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </aside>

        <main
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? 'ml-64' : 'ml-0'
          } p-6`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
