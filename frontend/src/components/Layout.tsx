import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_MAP } from '../types';
import {
  Package, ClipboardList, DollarSign, AlertTriangle, BarChart3,
  Building2, FileText, LogOut, Menu, Truck, Home,
  Grid3X3, Users, TrendingUp, ShoppingBag,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: any;
  path: string;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  ops: [
    { label: '我的任务', icon: ClipboardList, path: '/courier' },
    { label: '包裹操作', icon: Package, path: '/courier/packages' },
    { label: '我的绩效', icon: TrendingUp, path: '/courier/performance' },
  ],
  platform: [
    { label: '包裹管理', icon: Package, path: '/branch' },
    { label: '揽派调度', icon: ClipboardList, path: '/branch/tasks' },
    { label: '驿站/柜机', icon: Grid3X3, path: '/branch/locker-stations' },
    { label: '派费结算', icon: DollarSign, path: '/branch/settlements' },
    { label: '客户分群', icon: Users, path: '/branch/customer-groups' },
    { label: '微店订单', icon: ShoppingBag, path: '/branch/shop-orders' },
    { label: '异常预警', icon: AlertTriangle, path: '/branch/alerts' },
  ],
  admin: [
    { label: '数据看板', icon: BarChart3, path: '/admin' },
    { label: '网点管理', icon: Building2, path: '/admin/branches' },
    { label: '驿站/柜机', icon: Grid3X3, path: '/admin/locker-stations' },
    { label: '派费审核', icon: DollarSign, path: '/admin/settlements' },
    { label: '组织绩效', icon: TrendingUp, path: '/admin/performance' },
    { label: '客户分群', icon: Users, path: '/admin/customer-groups' },
    { label: '微店订单', icon: ShoppingBag, path: '/admin/shop-orders' },
    { label: '异常预警', icon: AlertTriangle, path: '/admin/alerts' },
    { label: '审计日志', icon: FileText, path: '/admin/audit-logs' },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = user ? (NAV_BY_ROLE[user.role] || []) : [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-60 bg-white border-r border-gray-200 flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center gap-2 px-5 border-b border-gray-100 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center">
            <Truck size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-800 text-sm">快递末端作业平台</span>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  active
                    ? 'text-primary bg-primary/5 font-medium border-r-2 border-primary'
                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Home size={14} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">{user?.name}</div>
              <div className="text-xs text-gray-400">{user ? ROLE_MAP[user.role] : ''}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-danger rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            退出登录
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 mr-2"
          >
            <Menu size={20} />
          </button>
          <h2 className="text-lg font-semibold text-gray-800">
            {navItems.find((n) => n.path === location.pathname)?.label || '快递末端作业平台'}
          </h2>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
