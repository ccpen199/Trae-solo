import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Map,
  FileText,
  CheckSquare,
  AlertTriangle,
  Megaphone,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Home,
} from 'lucide-react';
import useAuthStore from '@/stores/authStore';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: '首页仪表盘', icon: <LayoutDashboard size={18} />, path: '/', roles: ['farmer', 'village', 'township', 'supervisor'] },
  { label: '农户档案', icon: <Users size={18} />, path: '/households', roles: ['farmer', 'village', 'township', 'supervisor'] },
  { label: '地块管理', icon: <Map size={18} />, path: '/parcels', roles: ['farmer', 'village', 'township', 'supervisor'] },
  { label: '申请管理', icon: <FileText size={18} />, path: '/applications', roles: ['farmer', 'village', 'township', 'supervisor'] },
  { label: '审批工作台', icon: <CheckSquare size={18} />, path: '/approval', roles: ['village', 'township', 'supervisor'] },
  { label: '异常队列', icon: <AlertTriangle size={18} />, path: '/anomalies', roles: ['township', 'supervisor'] },
  { label: '公示公告', icon: <Megaphone size={18} />, path: '/notices', roles: ['village', 'township', 'supervisor'] },
  { label: '报表中心', icon: <BarChart3 size={18} />, path: '/reports', roles: ['township', 'supervisor'] },
];

const roleLabels: Record<string, string> = {
  farmer: '农户',
  village: '村委',
  township: '乡镇审批员',
  supervisor: '监管人员',
};

function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  const labelMap: Record<string, string> = {
    households: '农户档案',
    parcels: '地块管理',
    applications: '申请管理',
    approval: '审批工作台',
    anomalies: '异常队列',
    notices: '公示公告',
    reports: '报表中心',
    new: '新增',
    edit: '编辑',
  };

  return (
    <nav className="flex items-center gap-1 text-sm text-slate-500">
      <Link to="/" className="flex items-center gap-1 hover:text-teal-700">
        <Home size={14} />
        <span>首页</span>
      </Link>
      {segments.map((seg, i) => {
        const path = '/' + segments.slice(0, i + 1).join('/');
        const isLast = i === segments.length - 1;
        const label = labelMap[seg] || seg;
        return (
          <span key={path} className="flex items-center gap-1">
            <ChevronRight size={14} />
            {isLast ? (
              <span className="text-slate-800 font-medium">{label}</span>
            ) : (
              <Link to={path} className="hover:text-teal-700">{label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const filteredNav = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`${
          collapsed ? 'w-16' : 'w-[200px]'
        } bg-teal-900 text-white flex flex-col transition-all duration-200 flex-shrink-0`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-teal-800">
          {!collapsed && <span className="text-lg font-bold tracking-wide">宅基地管理</span>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-teal-800 transition-colors"
          >
            {collapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-teal-700 text-white'
                    : 'text-teal-200 hover:bg-teal-800 hover:text-white'
                }`}
              >
                {item.icon}
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-teal-800 p-3">
          {user && !collapsed && (
            <div className="mb-2 px-1">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-xs text-teal-300">{roleLabels[user.role]}</div>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-teal-200 hover:bg-teal-800 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            {!collapsed && <span className="text-sm">退出登录</span>}
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
          <Breadcrumbs />
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
