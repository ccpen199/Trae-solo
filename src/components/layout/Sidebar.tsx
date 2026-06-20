
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  Megaphone,
  User,
  Calendar,
  CreditCard,
  Users,
  PlusCircle,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { Badge } from '@/components/ui/Badge';
import type { UserRole } from '@shared/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: UserRole[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const roleLabels: Record<UserRole, string> = {
  artist: '艺人',
  agency_admin: '经纪公司',
  company_hr: '企业 HR',
  admin: '管理员',
};

const navSections: NavSection[] = [
  {
    title: 'Main',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
      { href: '/talent-search', label: 'Talent Search', icon: <Search className="w-5 h-5" /> },
      { href: '/castings', label: 'Castings', icon: <Megaphone className="w-5 h-5" /> },
    ],
  },
  {
    title: 'Artist',
    items: [
      { href: '/profile', label: 'My Profile', icon: <User className="w-5 h-5" />, roles: ['artist'] },
      { href: '/schedule', label: 'My Schedule', icon: <Calendar className="w-5 h-5" />, roles: ['artist'] },
      { href: '/model-cards', label: 'Model Cards', icon: <CreditCard className="w-5 h-5" />, roles: ['artist'] },
    ],
  },
  {
    title: 'Agency',
    items: [
      { href: '/artists', label: 'My Artists', icon: <Users className="w-5 h-5" />, roles: ['agency_admin', 'admin'] },
      { href: '/publish-casting', label: 'Publish Casting', icon: <PlusCircle className="w-5 h-5" />, roles: ['agency_admin', 'admin'] },
      { href: '/team', label: 'Team', icon: <Users className="w-5 h-5" />, roles: ['agency_admin', 'admin'] },
    ],
  },
  {
    title: 'Settings',
    items: [
      { href: '/security', label: 'Security', icon: <Shield className="w-5 h-5" /> },
      { href: '/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user, artistProfile, logout } = useAuthStore();

  const filteredSections = navSections.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => !item.roles || !user?.role || item.roles.includes(user.role)
    ),
  })).filter((section) => section.items.length > 0);

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const displayName = artistProfile?.stageName || user?.email?.split('@')[0] || 'User';
  const avatarUrl = artistProfile?.mediaAssets?.find((m) => m.isPrimary)?.url;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-midnight-900 border-r border-midnight-700 flex flex-col transition-all duration-300 ease-out-expo z-40',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-midnight-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <span className="font-heading text-xl font-bold text-white animate-fade-in">
              TalentHub
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          className={cn(
            'p-2 rounded-lg text-midnight-400 hover:text-white hover:bg-midnight-700 transition-all duration-300',
            collapsed && 'mx-auto'
          )}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {filteredSections.map((section, sectionIndex) => (
          <div key={section.title} className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-xs font-semibold text-midnight-500 uppercase tracking-wider mb-2">
                {section.title}
              </p>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ease-out-expo group',
                  collapsed && 'justify-center px-0',
                  isActive(item.href)
                    ? 'bg-gradient-primary text-white shadow-button'
                    : 'text-midnight-300 hover:text-white hover:bg-midnight-700/50'
                )}
              >
                <span className={cn(
                  'flex-shrink-0 transition-transform duration-300',
                  isActive(item.href) ? 'text-white' : 'text-midnight-400 group-hover:text-white'
                )}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="font-medium text-sm whitespace-nowrap animate-fade-in">
                    {item.label}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-midnight-700">
        <div className={cn(
          'p-3 rounded-xl bg-midnight-800/50 transition-all duration-300',
          collapsed && 'p-2'
        )}>
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <div className="relative flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-rose-500/50"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-midnight-800 rounded-full" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="primary" size="sm" dot>
                    {user?.role ? roleLabels[user.role] : 'Guest'}
                  </Badge>
                </div>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={logout}
                className="p-2 text-midnight-400 hover:text-rose-400 hover:bg-midnight-700 rounded-lg transition-all duration-300"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
