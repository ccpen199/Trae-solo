import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Network, 
  BarChart3, 
  Building2, 
  Package, 
  Search, 
  AlertTriangle, 
  MessageSquare, 
  Grid3x3,
  ChevronLeft,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { cn } from '../../lib/utils';

const menuItems = [
  { path: '/', label: '数据概览', icon: LayoutDashboard, key: 'home' },
  { path: '/relationship', label: '人物关系图谱', icon: Network, key: 'relationship' },
  { path: '/finance', label: '企业财务数据库', icon: BarChart3, key: 'finance' },
  { path: '/projects', label: '项目开发全周期', icon: Building2, key: 'projects' },
  { path: '/supply-chain', label: '物业与家居供应链', icon: Package, key: 'supply-chain' },
  { path: '/search', label: '多维交叉检索', icon: Search, key: 'search' },
  { path: '/monitoring', label: '财报异动监测', icon: AlertTriangle, key: 'monitoring' },
  { path: '/sentiment', label: '舆情情感分析', icon: MessageSquare, key: 'sentiment' },
  { path: '/dashboard', label: '定制化看板', icon: Grid3x3, key: 'dashboard' },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, setCurrentPage } = useAppStore();

  const handleNavigate = (path: string, key: string) => {
    navigate(path);
    setCurrentPage(key);
  };

  return (
    <aside
      className={cn(
        'h-screen bg-dark-900/80 backdrop-blur-xl border-r border-dark-700/50 flex flex-col transition-all duration-300',
        sidebarCollapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-dark-700/50">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">房察智云</h1>
              <p className="text-[10px] text-dark-400">Real Estate Intelligence</p>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-10 h-10 mx-auto rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 space-y-1">
          {!sidebarCollapsed && (
            <p className="px-3 py-2 text-xs font-medium text-dark-500 uppercase tracking-wider">
              数据中心
            </p>
          )}
          
          {menuItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.key}
                onClick={() => handleNavigate(item.path, item.key)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                  isActive 
                    ? 'bg-brand-500/15 text-brand-400 shadow-sm'
                    : 'text-dark-400 hover:bg-dark-800/50 hover:text-dark-200'
                )}
              >
                <Icon className={cn(
                  'w-5 h-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-brand-400' : 'text-dark-500 group-hover:text-dark-300'
                )} />
                {!sidebarCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
                {isActive && !sidebarCollapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400 shadow-lg shadow-brand-400/50" />
                )}
              </button>
            );
          })}
        </div>

        {!sidebarCollapsed && (
          <div className="mt-6 px-3">
            <p className="px-3 py-2 text-xs font-medium text-dark-500 uppercase tracking-wider">
              分析工具
            </p>
          </div>
        )}
        
        <div className="px-3 space-y-1 mt-1">
          {menuItems.slice(5).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.key}
                onClick={() => handleNavigate(item.path, item.key)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                  isActive 
                    ? 'bg-brand-500/15 text-brand-400 shadow-sm'
                    : 'text-dark-400 hover:bg-dark-800/50 hover:text-dark-200'
                )}
              >
                <Icon className={cn(
                  'w-5 h-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-brand-400' : 'text-dark-500 group-hover:text-dark-300'
                )} />
                {!sidebarCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
                {isActive && !sidebarCollapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400 shadow-lg shadow-brand-400/50" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="p-3 border-t border-dark-700/50">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-dark-400 hover:bg-dark-800/50 hover:text-dark-200 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">收起菜单</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
