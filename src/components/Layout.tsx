import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Camera, MonitorSquare, AlertTriangle,
  Video, Building2, Users, Settings, LogOut, ChevronRight,
  ShieldCheck, HardDriveUpload, ScrollText, BookOpen
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import type { User } from '@/types';
import { ROLE_MAP } from '@/types';
import { useEffect, useState } from 'react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { path: '/devices', label: '设备管理', icon: Camera },
  { path: '/preview', label: '实时预览', icon: MonitorSquare },
  { path: '/alerts', label: '告警中心', icon: AlertTriangle },
  { path: '/recordings', label: '录像检索', icon: Video },
  { path: '/organizations', label: '组织架构', icon: Building2 },
  { path: '/permissions', label: '权限管理', icon: ShieldCheck, adminOnly: true },
];

const settingsItems: NavItem[] = [
  { path: '/settings/health', label: '设备健康', icon: HardDriveUpload, adminOnly: true },
  { path: '/settings/firmware', label: '固件升级', icon: HardDriveUpload, adminOnly: true },
  { path: '/settings/audit', label: '审计日志', icon: ScrollText, adminOnly: true },
  { path: '/settings/sdk', label: 'SDK 文档', icon: BookOpen, adminOnly: true },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const setUser = useAuthStore(s => s.setUser);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    api.get('/auth/me').then(res => {
      if (res.data.success) {
        setUser(res.data.user as User);
      }
    }).catch(() => {});
  }, [setUser]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';
  const visibleNav = navItems.filter(n => !n.adminOnly || isAdmin);
  const visibleSettings = settingsItems.filter(n => !n.adminOnly || isAdmin);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 侧边栏 */}
      <aside
        className={cn(
          "relative flex flex-col bg-vms-surface border-r border-vms-border transition-all duration-300",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <div className="flex items-center h-16 px-4 border-b border-vms-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-vms-primary to-blue-700 flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <span className="font-mono font-bold text-lg text-white">云瞳</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-br from-vms-primary to-blue-700 flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-5 w-6 h-6 rounded-full bg-vms-surface-2 border border-vms-border flex items-center justify-center hover:border-vms-primary transition-colors"
          >
            <ChevronRight className={cn("w-3 h-3 text-vms-text-muted transition-transform", collapsed ? "" : "rotate-180")} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {visibleNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
                isActive
                  ? "bg-vms-primary/15 text-vms-primary border border-vms-primary/30 shadow-vms-glow"
                  : "text-vms-text-muted hover:bg-vms-surface-2 hover:text-vms-text",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}

          {visibleSettings.length > 0 && (
            <>
              {!collapsed && (
                <div className="pt-4 pb-1 px-3">
                  <span className="text-xs font-medium text-vms-text-muted uppercase tracking-wider">系统设置</span>
                </div>
              )}
              {visibleSettings.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
                    isActive
                      ? "bg-vms-primary/15 text-vms-primary border border-vms-primary/30"
                      : "text-vms-text-muted hover:bg-vms-surface-2 hover:text-vms-text",
                    collapsed && "justify-center px-0"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="border-t border-vms-border p-3">
          {collapsed ? (
            <button
              onClick={handleLogout}
              className="w-10 h-10 mx-auto rounded-lg hover:bg-vms-surface-2 flex items-center justify-center text-vms-text-muted hover:text-vms-danger transition-colors"
              title="退出登录"
            >
              <LogOut className="w-5 h-5" />
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-vms-primary to-purple-600 flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user?.name}</div>
                <div className="text-xs text-vms-text-muted truncate">{user ? ROLE_MAP[user.role] : ''}</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-vms-surface-2 text-vms-text-muted hover:text-vms-danger transition-colors"
                title="退出登录"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
