import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wrench,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trash2,
  ClipboardCheck,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/', label: '看板', icon: LayoutDashboard },
  { path: '/parts', label: '备件档案', icon: Package },
  { path: '/stock-in', label: '入库管理', icon: ArrowDownToLine },
  { path: '/stock-out', label: '领用出库', icon: ArrowUpFromLine },
  { path: '/work-orders', label: '工单管理', icon: Wrench },
  { path: '/inventory', label: '库存与流水', icon: History },
  { path: '/returns', label: '退回管理', icon: RefreshCw },
  { path: '/scraps', label: '报废管理', icon: Trash2 },
  { path: '/transfers', label: '调拨管理', icon: ClipboardCheck },
  { path: '/stock-taking', label: '盘点管理', icon: ClipboardList },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-100">
      <aside
        className={cn(
          'bg-white border-r border-gray-200 flex flex-col transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {!collapsed && (
            <span className="font-bold text-lg text-blue-600">备件管理系统</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <Icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h1 className="font-semibold text-gray-800">
            {menuItems.find(m => location.pathname === m.path ||
              (m.path !== '/' && location.pathname.startsWith(m.path)))?.label || '看板'}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">当前用户: 管理员</span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
