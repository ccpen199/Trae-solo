import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Briefcase,
  PlusCircle,
  Users,
  FolderOpen,
  Shield,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/tasks', label: '任务大厅', icon: Briefcase },
  { path: '/publish', label: '发布需求', icon: PlusCircle, roles: ['employer', 'admin'] },
  { path: '/talents', label: '人才库', icon: Users },
  { path: '/workspace', label: '工作台', icon: FolderOpen },
  { path: '/admin', label: '后台管理', icon: Shield, roles: ['admin'] },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNav = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center px-6">
        <button
          className="lg:hidden mr-4 p-1 rounded-lg hover:bg-gray-100"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center">
            <LayoutDashboard size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-gray-800">创意服务平台</span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium text-sm">
                {user.name.charAt(0)}
              </div>
              <span className="text-sm text-gray-600 hidden sm:block">{user.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-gray-400 hover:text-danger transition-colors text-sm"
              >
                <LogOut size={16} />
                <span className="hidden sm:block">退出</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <aside
        className={`fixed top-16 left-0 w-60 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 z-40 transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="p-4 space-y-1">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="lg:ml-60 pt-16 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
