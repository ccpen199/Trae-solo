import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ListChecks,
  Layers,
  Users,
  Wallet,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const { admin, isLoggedIn, logout } = useAdminStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const adminInfo = localStorage.getItem('adminInfo');
    if (!isLoggedIn && !adminInfo) {
      navigate('/admin/login');
    }
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: '数据概览', path: '/admin' },
    { icon: ListChecks, label: '任务审核', path: '/admin/tasks/audit' },
    { icon: Layers, label: '任务池调度', path: '/admin/tasks/pool' },
    { icon: Users, label: '用户管理', path: '/admin/users' },
    { icon: Wallet, label: '提现管理', path: '/admin/withdraw' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') return window.location.pathname === '/admin';
    return window.location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout();
      navigate('/admin/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-dark-800 text-white transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center">
              <span className="font-bold text-sm">赚</span>
            </div>
            {sidebarOpen && <span className="font-bold text-lg">赚金币后台</span>}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1 hover:bg-white/10 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                  active
                    ? 'bg-primary-500/20 text-primary-400 border-r-4 border-primary-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                    {active && <ChevronRight size={16} />}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut size={20} className="flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">退出登录</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-bold text-dark-800">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-dark-500">
              管理员：{admin?.username || 'admin'}
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
