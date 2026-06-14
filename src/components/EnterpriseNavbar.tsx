import { Building2, LayoutDashboard, Receipt, Package, Bell, Menu, X, Phone, User } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useEnterpriseStore } from '@/store/useEnterpriseStore';

export default function EnterpriseNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const enterprise = useEnterpriseStore((state) => state.enterprise);

  const navItems = [
    { path: '/enterprise', label: '控制台', icon: LayoutDashboard },
    { path: '/enterprise/orders', label: '服务包订单', icon: Package },
    { path: '/enterprise/billing', label: '账单管理', icon: Receipt },
  ];

  const isActive = (path: string) => {
    if (path === '/enterprise') return location.pathname === '/enterprise';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/enterprise" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-soft">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-secondary-800 leading-tight">企业客户中心</h1>
              <p className="text-xs text-secondary-500">暖心到家 · 企业版</p>
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
            <button className="relative p-2 rounded-lg hover:bg-secondary-50 transition-colors">
              <Bell className="w-5 h-5 text-secondary-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
            </button>

            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-secondary-800">{enterprise?.name || '企业客户'}</p>
                <p className="text-xs text-secondary-500 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {enterprise?.contact}
                  <span className="mx-1">·</span>
                  <Phone className="w-3 h-3" />
                  {enterprise?.phone}
                </p>
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
              <div className="flex items-center gap-3 py-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-secondary-800">{enterprise?.name || '企业客户'}</p>
                  <p className="text-sm text-secondary-500">{enterprise?.contact} · {enterprise?.phone}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
