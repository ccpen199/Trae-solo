import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  PanelLeftClose, PanelLeft, Film, ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/stores/app';
import { navItems } from '@/config/nav';
import { clsx } from 'clsx';

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, currentRoute, setCurrentRoute } = useAppStore();
  const location = useLocation();
  const [activeGroup, setActiveGroup] = useState<string>('数据分析');

  useEffect(() => {
    setCurrentRoute(location.pathname);
    const item = navItems.find(n => location.pathname.startsWith(n.path) || n.path === location.pathname);
    if (item?.group) setActiveGroup(item.group);
  }, [location.pathname, setCurrentRoute]);

  const groups = Array.from(new Set(navItems.map(n => n.group).filter(Boolean) as string[]));

  return (
    <aside
      className={clsx(
        'flex flex-col h-screen bg-space-950/80 backdrop-blur-xl border-r border-space-700/40 transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-space-700/40">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-glow-gold">
              <Film className="w-5 h-5 text-space-950" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-serif font-bold text-sm text-gradient-gold leading-tight">CIP</div>
              <div className="text-[10px] text-slate-500 leading-tight tracking-wide">影视智能决策</div>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-9 h-9 mx-auto rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-glow-gold">
            <Film className="w-5 h-5 text-space-950" strokeWidth={2.5} />
          </div>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={clsx(
            'p-1.5 rounded-md text-slate-500 hover:text-gold-400 hover:bg-space-700/50 transition-colors',
            sidebarCollapsed && 'mx-auto'
          )}
        >
          {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin">
        {groups.map(group => {
          const items = navItems.filter(n => n.group === group);
          const isActiveGroup = activeGroup === group;
          return (
            <div key={group} className="mb-1">
              {!sidebarCollapsed && (
                <div
                  className={clsx(
                    'px-4 py-2 text-[10px] font-medium tracking-widest uppercase flex items-center gap-1.5 transition-colors',
                    isActiveGroup ? 'text-gold-500/80' : 'text-slate-500'
                  )}
                >
                  <ChevronRight className={clsx('w-3 h-3 transition-transform', isActiveGroup && 'rotate-90')} />
                  {group}
                </div>
              )}
              {items.map(item => {
                const isActive = currentRoute === item.path ||
                  (item.path !== '/' && currentRoute.startsWith(item.path));
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={clsx(
                      'nav-link mx-2',
                      isActive && 'nav-link-active',
                      sidebarCollapsed && 'justify-center px-0'
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" strokeWidth={1.8} />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-sm">{item.label}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded-full bg-cine-500/20 text-cine-400 text-[10px] font-medium border border-cine-500/30">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {!sidebarCollapsed && (
        <div className="p-3 mx-2 mb-3 rounded-xl bg-gradient-to-br from-gold-500/10 to-transparent border border-gold-500/20">
          <div className="text-xs text-gold-400/90 font-medium mb-1">当前权限</div>
          <div className="text-[11px] text-slate-400">企业定制版 · 全模块可用</div>
        </div>
      )}
    </aside>
  );
}
