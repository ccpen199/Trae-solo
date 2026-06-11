import { cn } from '@/lib/utils';
import {
  Home,
  Activity,
  FileBarChart,
  Music,
  Target,
  AlertTriangle,
  User,
  Moon,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  id: string;
  label: string;
  icon: typeof Home;
}

const navItems: NavItem[] = [
  { id: 'home', label: '首页', icon: Home },
  { id: 'monitor', label: '睡眠监测', icon: Activity },
  { id: 'report', label: '睡眠报告', icon: FileBarChart },
  { id: 'audio', label: '音频库', icon: Music },
  { id: 'plan', label: '改善计划', icon: Target },
  { id: 'risk', label: '风险评估', icon: AlertTriangle },
  { id: 'profile', label: '个人中心', icon: User },
];

interface SidebarProps {
  className?: string;
  activeId?: string;
  onNavClick?: (id: string) => void;
}

export function Sidebar({ className, activeId = 'home', onNavClick }: SidebarProps) {
  const [active, setActive] = useState(activeId);

  const handleClick = (id: string) => {
    setActive(id);
    onNavClick?.(id);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-50 w-64 hidden md:flex flex-col',
        'bg-gradient-to-b from-night-800/80 to-night-900/90',
        'backdrop-blur-2xl border-r border-white/5',
        'shadow-[4px_0_40px_rgba(7,14,39,0.5)]',
        className
      )}
    >
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-dream-400 to-night-500 flex items-center justify-center shadow-glow-dream">
            <Moon className="w-6 h-6 text-white" />
            <div className="absolute inset-0 rounded-2xl animate-pulse-ring bg-dream-400/30" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white font-display">
              深睡空间
            </h1>
            <p className="text-xs text-silver-400">Sleep Wellness</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-2xl',
                'text-sm font-medium transition-all duration-300',
                'group relative overflow-hidden',
                isActive
                  ? 'text-white bg-gradient-to-r from-dream-500/20 to-night-600/30 shadow-glow-dream/50'
                  : 'text-silver-300 hover:text-white hover:bg-white/5'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-dream-300 to-mint-300 shadow-[0_0_10px_rgba(155,126,219,0.8)]" />
              )}
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0 transition-all duration-300',
                  isActive && 'text-dream-300 drop-shadow-[0_0_8px_rgba(155,126,219,0.8)]'
                )}
              />
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="p-4 rounded-3xl bg-gradient-to-br from-night-600/50 to-night-700/50 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-mint-400 to-dream-400 flex items-center justify-center text-night-800 font-semibold text-sm">
              用
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">睡眠用户</p>
              <p className="text-xs text-silver-400">连续打卡 7 天</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
