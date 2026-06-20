import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Hotel,
  Wallet,
  Receipt,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  Globe,
  Bell,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuthStore, selectUser } from '../../store/authStore';

interface PlatformAdminLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const PlatformAdminLayout: React.FC<PlatformAdminLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const user = useAuthStore(selectUser);

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard, path: '/admin' },
    { id: 'hotel-review', label: '酒店审核', icon: Hotel, path: '/admin/hotel-review' },
    { id: 'commissions', label: '佣金结算', icon: Wallet, path: '/admin/commissions' },
    { id: 'taxes', label: '税务规则', icon: Receipt, path: '/admin/taxes' },
    { id: 'gdpr', label: 'GDPR请求', icon: Shield, path: '/admin/gdpr' },
    { id: 'settings', label: '系统设置', icon: Settings, path: '/admin/settings' },
  ];

  const getBreadcrumb = (): string => {
    const path = location.pathname;
    const item = menuItems.find(m => m.path === path || path.startsWith(m.path + '/'));
    return item?.label || '仪表盘';
  };

  const isActive = (path: string): boolean => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    useAuthStore.getState().logout();
  };

  return (
    <div className="min-h-screen bg-cloud-50 flex">
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-deep-blue text-white rounded-lg lg:hidden shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-deep-blue-900 text-white flex flex-col transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-60',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className={cn(
          'flex items-center h-16 border-b border-deep-blue-800 px-4',
          collapsed ? 'justify-center' : 'justify-between'
        )}>
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gold-foil rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-deep-blue-900" />
                </div>
                <div>
                  <p className="font-display font-bold text-sm">运营后台</p>
                  <p className="text-xs text-deep-blue-400">StayGlobal</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden p-1 hover:bg-deep-blue-800 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="w-8 h-8 bg-gold-foil rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-deep-blue-900" />
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="px-4 py-3 border-b border-deep-blue-800">
            <p className="text-xs text-deep-blue-400 mb-1">平台名称</p>
            <p className="font-medium text-sm truncate">StayGlobal 全球酒店平台</p>
          </div>
        )}

        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                      active
                        ? 'bg-gold-foil/20 text-gold-foil border-l-2 border-gold-foil'
                        : 'text-deep-blue-200 hover:bg-deep-blue-800 hover:text-white',
                      collapsed && 'justify-center'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-deep-blue-800 p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center justify-center p-2 text-deep-blue-400 hover:text-white hover:bg-deep-blue-800 rounded-lg transition-colors"
            title={collapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </aside>

      <div className={cn(
        'flex-1 flex flex-col min-h-screen transition-all duration-300',
        collapsed ? 'lg:ml-16' : 'lg:ml-60'
      )}>
        <header className="h-16 bg-white border-b border-cloud-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-2 ml-10 lg:ml-0">
            <nav className="flex items-center gap-2 text-sm">
              <Link to="/admin" className="text-graphite-400 hover:text-deep-blue">
                平台后台
              </Link>
              <span className="text-graphite-300">/</span>
              <span className="text-graphite-700 font-medium">{getBreadcrumb()}</span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 text-graphite-500 hover:text-deep-blue hover:bg-cloud-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral-orange rounded-full" />
            </button>

            <div className="flex items-center gap-2 pl-3 border-l border-cloud-200">
              <div className="w-8 h-8 bg-deep-blue/10 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-deep-blue" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-graphite-900">
                  {user?.firstName || '平台管理员'}
                </p>
                <p className="text-xs text-graphite-500">
                  {user?.role === 'SUPER_ADMIN' ? '超级管理员' : '平台运营'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-graphite-500 hover:text-coral-orange hover:bg-coral-orange/10 rounded-lg transition-colors"
                title="退出登录"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PlatformAdminLayout;
