import { NavLink } from 'react-router-dom';
import {
  Mic,
  Volume2,
  Library,
  BookOpen,
  FileText,
  Info,
  Cat,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { to: '/', label: '声纹分析', icon: Mic },
  { to: '/synthesize', label: '语音合成', icon: Volume2 },
  { to: '/vocabulary', label: '声纹特征库', icon: Library },
  { to: '/knowledge', label: '科普知识', icon: BookOpen },
  { to: '/journal', label: '实验日志', icon: FileText },
  { to: '/about', label: '关于平台', icon: Info },
];

export default function Sidebar() {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen w-64 flex-col bg-deep-sea-dark border-r border-deep-sea-light/30',
        'hidden md:flex'
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-deep-sea-light/30 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-orange/20 text-amber-orange">
          <Cat className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-lg font-bold text-white">
            猫语翻译实验室
          </h1>
          <p className="text-xs text-slate-400">Cat Language Lab</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                  'hover:bg-deep-sea-light/30 hover:text-white',
                  isActive
                    ? 'bg-amber-orange/15 text-amber-orange shadow-glow-sm'
                    : 'text-slate-400'
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-deep-sea-light/30 p-4">
        <div className="flex items-start gap-2 rounded-xl bg-deep-sea/50 p-3">
          <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-mood-sky" />
          <p className="text-xs leading-relaxed text-slate-500">
            所有语音数据仅存储于本地浏览器，不会上传至任何服务器。
          </p>
        </div>
      </div>
    </aside>
  );
}
