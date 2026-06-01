import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Stethoscope,
  Building2,
  CalendarDays,
  ClipboardList,
  WalletCards,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
  { path: '/', label: '运营仪表盘', icon: LayoutDashboard },
  { path: '/doctors', label: '医生档案', icon: Stethoscope },
  { path: '/institutions', label: '合作机构', icon: Building2 },
  { path: '/scheduling', label: '排班计划', icon: CalendarDays },
  { path: '/appointments', label: '号源预约', icon: ClipboardList },
  { path: '/settlement', label: '结算报表', icon: WalletCards },
  { path: '/compliance', label: '合规审核', icon: ShieldCheck },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside
        className="fixed inset-y-0 left-0 z-20 flex flex-col border-r border-gray-200 bg-white transition-all duration-300"
        style={{ width: collapsed ? '64px' : '240px' }}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-blue-600">
                医生出诊管理
              </h1>
              <p className="text-xs text-gray-500">多点执业协同平台</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {!collapsed && (
          <div className="border-t border-gray-200 p-4">
            <div className="rounded-lg bg-blue-50 p-3">
              <p className="text-xs font-medium text-blue-700">运营管理员</p>
              <p className="mt-1 text-xs text-blue-600">权限：全功能访问</p>
            </div>
          </div>
        )}
      </aside>

      <main
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: collapsed ? '64px' : '240px' }}
      >
        <header className="sticky top-0 z-10 h-16 flex items-center justify-between border-b border-gray-200 bg-white px-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              系统正常
            </span>
          </div>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
