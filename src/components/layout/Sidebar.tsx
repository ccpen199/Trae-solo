import { NavLink } from 'react-router-dom';
import { Home, FileText, CheckSquare, Award, BarChart3, MessageSquareWarning, Settings, Shield, LayoutDashboard, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  role: 'reviewer' | 'brand' | 'admin';
}

const menuConfig = {
  reviewer: [
    { name: '工作台', icon: Home, path: '/reviewer/dashboard' },
    { name: '任务大厅', icon: ClipboardList, path: '/reviewer/tasks' },
    { name: '我的报告', icon: FileText, path: '/reviewer/reports' },
    { name: '质量评分', icon: Award, path: '/reviewer/quality' },
  ],
  brand: [
    { name: '数据概览', icon: LayoutDashboard, path: '/brand/dashboard' },
    { name: '舆情看板', icon: BarChart3, path: '/brand/reputation' },
    { name: '申诉中心', icon: MessageSquareWarning, path: '/brand/appeal' },
  ],
  admin: [
    { name: '管理面板', icon: LayoutDashboard, path: '/admin/dashboard' },
    { name: '评测计划', icon: CheckSquare, path: '/admin/plans' },
    { name: '审核工作流', icon: FileText, path: '/admin/reviews' },
    { name: '申诉处理', icon: MessageSquareWarning, path: '/admin/appeals' },
    { name: '权重配置', icon: Settings, path: '/admin/weights' },
  ],
};

const roleTitles = {
  reviewer: { title: '评测员中心', icon: Award },
  brand: { title: '品牌管理', icon: Shield },
  admin: { title: '管理后台', icon: Settings },
};

const homePaths: Record<string, string> = {
  reviewer: '/reviewer/dashboard',
  brand: '/brand/dashboard',
  admin: '/admin/dashboard',
};

export function Sidebar({ role }: SidebarProps) {
  const menus = menuConfig[role];
  const titleConfig = roleTitles[role];
  const TitleIcon = titleConfig.icon;
  const homePath = homePaths[role];

  return (
    <aside className="w-60 bg-surface border-r border-slate-700/50 min-h-[calc(100vh-64px)] sticky top-16">
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2 px-2">
          <TitleIcon className="w-5 h-5 text-primary" />
          <span className="font-serif font-semibold text-white">{titleConfig.title}</span>
        </div>
      </div>
      <nav className="p-3 space-y-1">
        {menus.map((menu) => {
          const Icon = menu.icon;
          return (
            <NavLink
              key={menu.path}
              to={menu.path}
              end={menu.path === homePath}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary border-l-2 border-primary'
                    : 'text-slate-300 hover:bg-surface-light hover:text-white'
                )
              }
            >
              <Icon className="w-4 h-4" />
              {menu.name}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
