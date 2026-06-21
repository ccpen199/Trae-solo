import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  FileText,
  Code2,
  Briefcase,
  Send,
  FileSignature,
  FolderKanban,
  KanbanSquare,
  FolderOpen,
  Wrench,
  Calculator,
  Bot,
  Library,
  Users,
  Wallet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Scale,
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  group?: string;
}

const navItems: NavItem[] = [
  { path: '/', label: '工作台', icon: LayoutDashboard, group: '概览' },
  { path: '/search', label: '大数据检索', icon: Search, group: '法律大数据' },
  { path: '/reports', label: '报告中心', icon: FileText, group: '法律大数据' },
  { path: '/developers', label: 'API管理', icon: Code2, group: '法律大数据' },
  { path: '/cases', label: '案源市场', icon: Briefcase, group: '案源交易' },
  { path: '/cases/publish', label: '发布案源', icon: Send, group: '案源交易' },
  { path: '/cases/bidding', label: '竞标大厅', icon: Gavel, group: '案源交易' },
  { path: '/contracts', label: '合同签署', icon: FileSignature, group: '案源交易' },
  { path: '/workspace', label: '办案中台', icon: FolderKanban, group: '协作办案' },
  { path: '/workspace/board', label: '任务看板', icon: KanbanSquare, group: '协作办案' },
  { path: '/workspace/evidence', label: '证据库', icon: FolderOpen, group: '协作办案' },
  { path: '/tools', label: '工具中心', icon: Wrench, group: '智能工具' },
  { path: '/tools/calculator', label: '法律计算器', icon: Calculator, group: '智能工具' },
  { path: '/tools/ai', label: '法条助手', icon: Bot, group: '智能工具' },
  { path: '/tools/templates', label: '文书模板', icon: Library, group: '智能工具' },
  { path: '/team', label: '团队管理', icon: Users, group: '系统管理' },
  { path: '/finance', label: '财务中心', icon: Wallet, group: '系统管理' },
  { path: '/settings', label: '个人设置', icon: Settings, group: '系统管理' },
];

function Gavel(props: any) {
  return <Scale {...props} />;
}

const Sidebar: React.FC<{ collapsed: boolean; onToggle: () => void }> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const user = useUserStore((state) => state.user);

  const groupedItems = navItems.reduce((acc, item) => {
    const group = item.group || '其他';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  return (
    <aside
      className={cn(
        'h-screen bg-primary-900 text-white flex flex-col transition-all duration-300 border-r border-primary-800',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-primary-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
              <Scale className="w-5 h-5 text-primary-900" />
            </div>
            <span className="font-serif text-lg font-semibold text-gold-gradient">法智云</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center mx-auto">
            <Scale className="w-5 h-5 text-primary-900" />
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-primary-800 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && user && (
        <div className="p-4 border-b border-primary-800">
          <div className="flex items-center gap-3">
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border-2 border-accent-gold" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{user.name}</div>
              <div className="text-xs text-neutral-ink-400 truncate">{user.firmInfo?.firmName}</div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-accent-gold animate-pulse" />
              <span className="text-xs text-neutral-ink-400">信用分</span>
            </div>
            <span className="text-sm font-semibold text-accent-gold">{user.creditScore}</span>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        {Object.entries(groupedItems).map(([group, items]) => (
          <div key={group} className="mb-4">
            {!collapsed && (
              <div className="px-4 mb-2 text-xs font-medium text-neutral-ink-500 uppercase tracking-wider">
                {group}
              </div>
            )}
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'lc-nav-item mx-2 mb-1',
                    isActive && 'lc-nav-item-active',
                    collapsed && 'justify-center px-0'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="text-sm">{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
