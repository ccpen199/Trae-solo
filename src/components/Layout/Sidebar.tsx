import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FileText,
  Users,
  AlertTriangle,
  ClipboardCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', label: '数据概览', icon: LayoutDashboard, roles: ['admin', 'operator', 'auditor', 'courier'] },
  { path: '/waybills', label: '运单管理', icon: Package, roles: ['admin', 'operator', 'courier'] },
  { path: '/realname', label: '实名审核', icon: ClipboardCheck, roles: ['admin', 'auditor'] },
  { path: '/exceptions', label: '异常处理', icon: AlertTriangle, roles: ['admin', 'operator', 'auditor'] },
  { path: '/orders', label: '监管工单', icon: FileText, roles: ['admin', 'auditor'] },
  { path: '/users', label: '用户管理', icon: Users, roles: ['admin'] },
  { path: '/settings', label: '系统设置', icon: Settings, roles: ['admin'] },
];

interface SidebarProps {
  role: UserRole;
}

export function Sidebar({ role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = menuItems.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={cn(
        'flex h-screen flex-col bg-primary text-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6" />
            <span className="text-lg font-semibold">实名监管平台</span>
          </div>
        )}
        {collapsed && <Mail className="h-6 w-6 mx-auto" />}
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {visibleItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                isActive ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white',
                collapsed && 'justify-center'
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="text-sm">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex h-12 items-center justify-center border-t border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
      </button>
    </aside>
  );
}
