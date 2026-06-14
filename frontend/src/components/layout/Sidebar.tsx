import { NavLink, useLocation } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import {
  LayoutDashboard,
  Library,
  Timer,
  ScanText,
  Share2,
  BarChart3,
  Download,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/library', label: '书籍库', icon: Library },
  { path: '/timer', label: '阅读计时', icon: Timer },
  { path: '/ocr', label: 'OCR笔记', icon: ScanText },
  { path: '/graph', label: '知识图谱', icon: Share2 },
  { path: '/review', label: '复盘看板', icon: BarChart3 },
  { path: '/export', label: '数据导出', icon: Download },
  { path: '/admin', label: '后台管理', icon: ShieldCheck },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, theme, toggleTheme } = useUIStore();
  const location = useLocation();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full z-40 flex flex-col',
        'bg-ink-800 text-parchment-100',
        'border-r border-classic-gold/10',
        'transition-all duration-300 ease-out',
        sidebarCollapsed ? 'w-[68px]' : 'w-[220px]'
      )}
    >
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-classic-gold/10',
        sidebarCollapsed ? 'justify-center' : 'gap-3'
      )}>
        <BookOpen className="w-6 h-6 text-classic-gold flex-shrink-0" />
        {!sidebarCollapsed && (
          <span className="font-serif font-semibold text-lg tracking-wider text-classic-gold">
            藏书架
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-hide">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                'transition-all duration-200 text-sm font-medium',
                sidebarCollapsed && 'justify-center px-0',
                isActive
                  ? 'bg-classic-gold/15 text-classic-gold border border-classic-gold/20'
                  : 'text-ink-300 hover:text-parchment-200 hover:bg-ink-700/50'
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-classic-gold')} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-2 pb-4 space-y-2">
        <button
          onClick={toggleTheme}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg',
            'text-ink-300 hover:text-parchment-200 hover:bg-ink-700/50',
            'transition-all duration-200 text-sm',
            sidebarCollapsed && 'justify-center px-0'
          )}
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 flex-shrink-0" />
          ) : (
            <Sun className="w-5 h-5 flex-shrink-0" />
          )}
          {!sidebarCollapsed && <span>{theme === 'light' ? '深色模式' : '浅色模式'}</span>}
        </button>

        <button
          onClick={toggleSidebar}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg',
            'text-ink-300 hover:text-parchment-200 hover:bg-ink-700/50',
            'transition-all duration-200 text-sm',
            sidebarCollapsed && 'justify-center px-0'
          )}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5 flex-shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 flex-shrink-0" />
              <span>收起侧栏</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
