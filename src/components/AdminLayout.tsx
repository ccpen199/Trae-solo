import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Flame, BarChart3, ArrowLeft, Truck } from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();

  const menu = [
    { to: '/admin', label: '数据概览', icon: LayoutDashboard, end: true },
    { to: '/admin/heatmap', label: '网点效能热力图', icon: Flame },
    { to: '/admin/clv', label: '客户生命周期价值 (CLV)', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen flex bg-neutral-50 no-print">
      <aside className="w-64 bg-neutral-700 text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-neutral-600 flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-accent-500 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold">管理后台</div>
            <div className="text-[10px] text-neutral-400">Admin Dashboard</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'bg-accent-500 text-white shadow-lg' : 'text-neutral-300 hover:bg-neutral-600 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-neutral-600">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-neutral-300 hover:bg-neutral-600 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            返回前台
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6">
          <h1 className="text-lg font-bold text-neutral-700">中通快递运营管理中心</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-500">欢迎您，王管理员</span>
            <div className="w-8 h-8 rounded-full bg-accent-500 text-white flex items-center justify-center text-sm font-bold">
              管
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
