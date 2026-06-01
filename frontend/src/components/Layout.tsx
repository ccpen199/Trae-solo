import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  AppWindow,
  ScanLine,
  AlertTriangle,
  FileJson,
  History,
  Shield,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useToast } from './Toast';

const navItems = [
  { path: '/dashboard', label: '工作台', icon: LayoutDashboard },
  { path: '/applications', label: '应用档案', icon: AppWindow },
  { path: '/tasks', label: '扫描任务', icon: ScanLine },
  { path: '/alerts', label: '告警中心', icon: AlertTriangle },
  { path: '/changes', label: '变更中心', icon: FileJson },
  { path: '/logs', label: '调用日志', icon: History, roles: ['platform_engineer', 'security_admin'] },
  { path: '/audit', label: '权限审计', icon: Shield, roles: ['platform_engineer', 'security_admin'] },
  { path: '/settings', label: '配置中心', icon: Settings, roles: ['platform_engineer', 'security_admin'] },
];

const roleLabels: Record<string, string> = {
  platform_engineer: '平台工程师',
  ops: '运维工程师',
  developer: '开发者',
  app_owner: '应用负责人',
  security_admin: '安全管理员',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { success } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    success('已退出登录');
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        } bg-navy-900 text-white transition-all duration-300 flex-shrink-0`}
      >
        <div className="p-4 border-b border-navy-700">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-orange-500" />
            <div>
              <h1 className="font-bold text-lg">漏洞扫描平台</h1>
              <p className="text-xs text-navy-300">Vulnerability Scan</p>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-navy-700 text-orange-500'
                    : 'text-navy-100 hover:bg-navy-800'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-navy-900 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.username.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-500">{roleLabels[user?.role || '']}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg z-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
