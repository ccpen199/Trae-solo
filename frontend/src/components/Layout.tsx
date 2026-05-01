import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Mail,
  FileText,
  Users,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  ChevronDown,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn, getRoleLabel } from '@/lib/utils';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const navItems = [
    {
      path: '/',
      label: '仪表板',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'MARKETING_OPERATOR', 'COPYWRITER', 'DATA_ANALYST', 'VIEWER'],
    },
    {
      path: '/campaigns',
      label: '营销活动',
      icon: Mail,
      roles: ['ADMIN', 'MARKETING_OPERATOR', 'COPYWRITER', 'DATA_ANALYST', 'VIEWER'],
    },
    {
      path: '/templates',
      label: '模板管理',
      icon: FileText,
      roles: ['ADMIN', 'COPYWRITER', 'MARKETING_OPERATOR', 'DATA_ANALYST', 'VIEWER'],
    },
    {
      path: '/audiences',
      label: '受众管理',
      icon: Users,
      roles: ['ADMIN', 'MARKETING_OPERATOR', 'DATA_ANALYST', 'VIEWER'],
    },
    {
      path: '/analytics',
      label: '数据分析',
      icon: BarChart3,
      roles: ['ADMIN', 'DATA_ANALYST', 'MARKETING_OPERATOR', 'VIEWER'],
    },
    {
      path: '/admin',
      label: '系统管理',
      icon: Settings,
      roles: ['ADMIN'],
    },
  ];
  
  const visibleNavItems = navItems.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false
  );
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <div className="flex h-screen bg-neutral-50">
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-neutral-900">邮件营销</h1>
              <p className="text-xs text-neutral-500">Email Marketing</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'nav-item',
                  isActive ? 'nav-item-active' : 'nav-item-inactive'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 cursor-pointer" onClick={() => setShowUserMenu(!showUserMenu)}>
            <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">{user?.name}</p>
              <p className="text-xs text-neutral-500 truncate">{getRoleLabel(user?.role || '')}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </div>
          
          {showUserMenu && (
            <div className="mt-2 p-2 bg-white border border-neutral-200 rounded-lg shadow-lg">
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 rounded-lg hover:bg-neutral-50"
                onClick={() => setShowUserMenu(false)}
              >
                <User className="w-4 h-4" />
                个人资料
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-danger-600 rounded-lg hover:bg-danger-50 w-full"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          )}
        </div>
      </aside>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              {visibleNavItems.find((item) => location.pathname === item.path)?.label ||
                visibleNavItems.find((item) => location.pathname.startsWith(item.path) && item.path !== '/')?.label ||
                '仪表板'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors">
              <Bell className="w-5 h-5 text-neutral-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full" />
            </button>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
