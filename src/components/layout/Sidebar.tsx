import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  FileText,
  Users,
  MessageSquare,
  BarChart3,
  Briefcase,
  UserCircle,
  Send,
  Building2,
  ShieldAlert,
  AlertTriangle,
  Settings,
  X,
  Building,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@shared/types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
}

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

const menuConfig: Record<UserRole, MenuItem[]> = {
  hr: [
    { path: '/hr/dashboard', label: '首页', icon: Home },
    { path: '/hr/jd-generator', label: 'JD生成', icon: FileText },
    { path: '/hr/talent-pool', label: '候选池', icon: Users },
    { path: '/hr/messages', label: '消息', icon: MessageSquare },
    { path: '/hr/analytics', label: '效能看板', icon: BarChart3 },
  ],
  talent: [
    { path: '/talent/jobs', label: '职位推荐', icon: Briefcase },
    { path: '/talent/profile', label: '我的画像', icon: UserCircle },
    { path: '/talent/messages', label: '消息', icon: MessageSquare },
    { path: '/talent/applications', label: '我的投递', icon: Send },
  ],
  admin: [
    { path: '/admin/company-review', label: '企业审核', icon: Building2 },
    { path: '/admin/risk-control', label: '风控中心', icon: ShieldAlert },
    { path: '/admin/labor-warning', label: '用工预警', icon: AlertTriangle },
    { path: '/admin/system-settings', label: '系统设置', icon: Settings },
  ],
  store_manager: [],
};

export function Sidebar({ isOpen, onClose, userRole }: SidebarProps) {
  const location = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems = menuConfig[userRole] || [];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 bg-white shadow-card z-50 flex flex-col',
          'transform transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:shadow-none lg:border-r border-neutral-200',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-mint-400 flex items-center justify-center shadow-glow">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold text-primary-700">智聘通</h1>
              <p className="text-xs text-neutral-500">Talent Match Pro</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                      'group relative overflow-hidden',
                      isActive
                        ? 'text-white shadow-card'
                        : 'text-neutral-600 hover:text-primary-600 hover:bg-primary-50'
                    )}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500 via-primary-600 to-mint-500" />
                    )}
                    <span className="relative z-10">
                      <Icon
                        className={cn(
                          'w-5 h-5 transition-transform duration-200',
                          isActive ? 'text-white' : 'group-hover:scale-110'
                        )}
                      />
                    </span>
                    <span className="relative z-10">{item.label}</span>
                    {isActive && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-glow" />
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {userRole === 'hr' && (
          <div className="p-4 border-t border-neutral-200">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-mint-50 border border-primary-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary-700">星辰酒店集团</p>
                  <p className="text-xs text-neutral-500">已认证企业</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-600">
                <span>剩余职位数</span>
                <span className="font-semibold text-accent-500">28 / 50</span>
              </div>
              <div className="mt-2 h-1.5 bg-white rounded-full overflow-hidden">
                <div className="h-full w-[56%] bg-gradient-to-r from-mint-400 to-primary-500 rounded-full transition-all duration-500" />
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
