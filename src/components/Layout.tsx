import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  LayoutDashboard, 
  Calendar, 
  Gift, 
  Shield, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  ChevronsRight
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: '仪表盘', roles: ['admin', 'operator', 'finance', 'risk'] },
  { path: '/activities', icon: Calendar, label: '活动管理', roles: ['admin', 'operator'] },
  { path: '/prizes', icon: Gift, label: '奖品管理', roles: ['admin', 'operator', 'finance'] },
  { path: '/winners', icon: ChevronsRight, label: '中奖发放', roles: ['admin', 'operator', 'finance'] },
  { path: '/risk', icon: Shield, label: '风控管理', roles: ['admin', 'risk'] },
  { path: '/reports', icon: BarChart3, label: '数据报表', roles: ['admin', 'operator', 'finance'] },
];

const roleNames: Record<string, string> = {
  admin: '超级管理员',
  operator: '运营',
  risk: '风控',
  finance: '财务',
};

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const admin = useAuthStore((state) => state.admin);
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allowedMenuItems = menuItems.filter(
    (item) => admin && item.roles.includes(admin.role)
  );

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <aside
        className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b">
          {sidebarOpen && (
            <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
              抽奖运营平台
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {allowedMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          {sidebarOpen && admin && (
            <div className="mb-3 px-4 py-2 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">{admin.username}</p>
              <p className="text-xs text-gray-500">{roleNames[admin.role]}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="font-medium">退出登录</span>}
          </button>
        </div>
      </aside>

      <main
        className={`transition-all duration-300 min-h-screen ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
