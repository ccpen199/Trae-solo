import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Monitor,
  Map,
  Route,
  Shield,
  Bell,
  Clock,
  Gauge,
  Cpu,
  Building2,
  Key,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Wifi,
  WifiOff,
  Server,
  Archive,
  Radio,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore, ROLE_LABELS } from '@/stores/authStore';
import { useWsStore } from '@/stores/wsStore';

const navItems = [
  { to: '/dashboard', icon: Monitor, label: '后台总览' },
  { to: '/monitor', icon: Map, label: '监控地图' },
  { to: '/trajectory', icon: Route, label: '轨迹回放' },
  { to: '/fence', icon: Shield, label: '电子围栏' },
  { to: '/alerts', icon: Bell, label: '告警中心' },
  { to: '/schedule', icon: Clock, label: '班次准点' },
  { to: '/driver-behavior', icon: Gauge, label: '驾驶行为' },
  { to: '/devices', icon: Cpu, label: '设备管理' },
  { to: '/organization', icon: Building2, label: '组织管理' },
  { to: '/api-gateway', icon: Key, label: 'API网关' },
  { to: '/profile', icon: User, label: '个人中心' },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const connected = useWsStore((s) => s.connected);
  const reconnectAttempts = useWsStore((s) => s.reconnectAttempts);
  const messageQueue = useWsStore((s) => s.messageQueue);
  const protocolStats = useWsStore((s) => s.protocolStats);
  const archiveStats = useWsStore((s) => s.archiveStats);
  const [statusOpen, setStatusOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
    }
    if (statusOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [statusOpen]);

  const roleLabel = user?.role ? ROLE_LABELS[user.role] || user.role : '';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-dark">
      <aside
        className={`flex flex-col border-r border-surface-border bg-surface transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-surface-border px-3">
          {!collapsed && (
            <span className="text-sm font-bold text-primary tracking-wide">
              车辆监控平台
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:bg-surface-light hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-400 hover:bg-surface-light hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-surface-border p-3">
          <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-light text-primary">
              <User size={16} />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white truncate">{user?.username || '用户'}</div>
                <div className="text-xs text-gray-500 truncate">{roleLabel}</div>
              </div>
            )}
            <button
              onClick={logout}
              className="flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:text-danger transition-colors"
              title="退出登录"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-surface-border bg-surface px-4">
          <div className="flex items-center gap-3" ref={panelRef}>
            <button
              onClick={() => setStatusOpen(!statusOpen)}
              className="flex items-center gap-1.5 rounded px-2 py-1 hover:bg-surface-light transition-colors"
            >
              {connected ? (
                <Wifi size={14} className="text-success" />
              ) : (
                <WifiOff size={14} className="text-danger" />
              )}
              <span className="text-xs text-gray-400">
                {connected ? '实时连接' : '连接断开'}
              </span>
              <ChevronDown size={12} className={`text-gray-500 transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
            </button>

            {statusOpen && (
              <div className="absolute top-14 left-4 z-50 w-80 dark-card border-surface-border animate-in fade-in slide-in-from-top-1">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400">连接状态</span>
                    <span className={`text-xs font-medium ${connected ? 'text-success' : 'text-danger'}`}>
                      {connected ? '已连接' : '已断开'}
                    </span>
                  </div>
                  {!connected && reconnectAttempts > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">重连次数</span>
                      <span className="text-warning">{reconnectAttempts}</span>
                    </div>
                  )}
                  {messageQueue.filter((m) => m.status === 'pending').length > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">待发送消息</span>
                      <span className="text-warning">{messageQueue.filter((m) => m.status === 'pending').length}</span>
                    </div>
                  )}
                  {protocolStats.lastMessageTime && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">最后更新</span>
                      <span className="text-gray-300">{new Date(protocolStats.lastMessageTime).toLocaleTimeString()}</span>
                    </div>
                  )}

                  <div className="border-t border-surface-border pt-2">
                    <span className="text-xs font-medium text-gray-400">协议统计</span>
                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 rounded bg-surface-dark px-2 py-1.5">
                        <Radio size={12} className="text-primary" />
                        <div>
                          <div className="text-xs text-gray-500">JT/T 808</div>
                          <div className="text-sm font-mono text-white">{protocolStats.jtt808}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded bg-surface-dark px-2 py-1.5">
                        <Server size={12} className="text-info" />
                        <div>
                          <div className="text-xs text-gray-500">GB/T 35658</div>
                          <div className="text-sm font-mono text-white">{protocolStats.gbt35658}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-surface-border pt-2">
                    <span className="text-xs font-medium text-gray-400">归档信息</span>
                    <div className="mt-1.5 flex items-center gap-2 rounded bg-surface-dark px-2 py-1.5">
                      <Archive size={12} className="text-warning" />
                      <div className="flex-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">今日数据点</span>
                          <span className="text-white font-mono">{archiveStats.totalPoints.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-gray-500">归档月份</span>
                          <span className="text-white">{archiveStats.archivedMonths} 个月</span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-gray-500">最近归档</span>
                          <span className="text-gray-300">{new Date(archiveStats.lastArchiveTime).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">{roleLabel}</span>
                <span>{user.orgName || ''}</span>
              </div>
            )}
            <button className="relative flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:text-white transition-colors">
              <Bell size={18} />
              <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-danger" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-surface-dark">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
