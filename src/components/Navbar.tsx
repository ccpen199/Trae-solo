import { Home, ClipboardList, User, Bell, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import RoleSwitcher from './RoleSwitcher';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const user = useAppStore((state) => state.user);

  const navItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/orders', label: '我的订单', icon: ClipboardList },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-soft">
              <span className="text-white font-bold text-lg">暖</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-secondary-800 leading-tight">暖心到家</h1>
              <p className="text-xs text-secondary-500">家政服务平台</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'nav-link flex items-center gap-2',
                    isActive(item.path) && 'nav-link-active'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <RoleSwitcher />

            <button className="relative p-2 rounded-lg hover:bg-secondary-50 transition-colors">
              <Bell className="w-5 h-5 text-secondary-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
            </button>

            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-secondary-800">{user?.nickname || '用户'}</p>
                <p className="text-xs text-secondary-500">{user?.phone}</p>
              </div>
            </div>
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-secondary-50"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 space-y-2 animate-fade-up">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'nav-link flex items-center gap-3 w-full',
                    isActive(item.path) && 'nav-link-active'
                  )}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-3 border-t border-gray-100">
              <RoleSwitcher />
            </div>
            <div className="flex items-center gap-3 py-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-secondary-800">{user?.nickname || '用户'}</p>
                <p className="text-sm text-secondary-500">{user?.phone}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
