import { User, HandHeart, LayoutDashboard, Building2, ChevronDown, ArrowRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import type { PageRole } from '@/types';

const roles: { key: PageRole; label: string; icon: typeof User; description: string; path: string }[] = [
  { key: 'user', label: '用户端', icon: User, description: '下单找服务', path: '/' },
  { key: 'worker', label: '阿姨端', icon: HandHeart, description: '阿姨接单工作台', path: '/worker' },
  { key: 'admin', label: '管理端', icon: LayoutDashboard, description: '运营管理后台', path: '/admin' },
  { key: 'enterprise', label: '企业端', icon: Building2, description: '企业批量服务', path: '/enterprise' },
];

export default function RoleSwitcher() {
  const currentRole = useAppStore((state) => state.currentRole);
  const setCurrentRole = useAppStore((state) => state.setCurrentRole);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = roles.find((r) => r.key === currentRole)!;
  const CurrentIcon = current.icon;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchRole = (role: typeof roles[0]) => {
    setCurrentRole(role.key);
    setOpen(false);
    navigate(role.path);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary-50 hover:bg-secondary-100 transition-colors"
      >
        <CurrentIcon className="w-4 h-4 text-secondary-600" />
        <span className="text-sm font-medium text-secondary-700 hidden sm:inline">{current.label}</span>
        <ChevronDown className={cn('w-4 h-4 text-secondary-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden animate-fade-up">
          <div className="px-4 py-3 bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-gray-100">
            <p className="text-sm font-medium text-secondary-700">切换角色入口</p>
            <p className="text-xs text-secondary-500 mt-0.5">体验不同角色的完整功能</p>
          </div>
          <div className="py-2">
            {roles.map((role) => {
              const Icon = role.icon;
              const isActive = currentRole === role.key;
              return (
                <button
                  key={role.key}
                  onClick={() => handleSwitchRole(role)}
                  className={cn(
                    'w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-secondary-50 transition-colors group',
                    isActive && 'bg-primary-50'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      isActive ? 'bg-primary-500 text-white' : 'bg-secondary-100 text-secondary-600 group-hover:bg-primary-100 group-hover:text-primary-600'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-medium', isActive ? 'text-primary-700' : 'text-secondary-800')}>
                      {role.label}
                    </p>
                    <p className="text-xs text-secondary-500 truncate">{role.description}</p>
                  </div>
                  <ArrowRight className={cn('w-4 h-4 flex-shrink-0 transition-all', isActive ? 'text-primary-500' : 'text-secondary-300 group-hover:translate-x-1 group-hover:text-primary-500')} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
