import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  ClipboardCheck,
  Calculator,
  Wallet,
  Truck,
  ShieldCheck,
  BarChart3,
  Menu,
  X,
  Recycle,
  ChevronRight,
} from 'lucide-react';

const menuItems = [
  { path: '/admin/inspection', label: '质检工单', icon: ClipboardCheck },
  { path: '/admin/pricing', label: '定价规则', icon: Calculator },
  { path: '/admin/settlement', label: '分账管理', icon: Wallet },
  { path: '/admin/logistics', label: '物流调度', icon: Truck },
  { path: '/admin/audit', label: '资质审核', icon: ShieldCheck },
  { path: '/admin/dashboard', label: '数据看板', icon: BarChart3 },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentMenu = menuItems.find((item) =>
    location.pathname.startsWith(item.path)
  );
  const breadcrumb = currentMenu ? currentMenu.label : '运营中心';

  return (
    <div className="flex min-h-screen bg-neutral-bg">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-neutral-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-700">
            <Recycle className="h-5 w-5 text-white" />
          </div>
          <span className="font-serif text-lg font-bold text-forest-700">运营中心</span>
        </div>

        <nav className="mt-4 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-forest-700 text-white'
                    : 'text-neutral-text hover:bg-forest-50 hover:text-forest-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-neutral-border bg-white px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-neutral-text hover:bg-gray-50 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1 text-sm text-neutral-muted">
              <span>运营中心</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-neutral-text">{breadcrumb}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-100">
              <span className="text-xs font-medium text-forest-700">管</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
