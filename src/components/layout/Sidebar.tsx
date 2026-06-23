import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  Building2,
  FileText,
  Database,
  LineChart,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/ui/Toast';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { UserRole } from '@shared/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: UserRole[];
  badge?: string | number;
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
  platform: '平台运营',
  ops: '运维人员',
};

const getNavSections = (role: UserRole | undefined): NavSection[] => {
  const allRoles: UserRole[] = ['artist', 'agency_admin', 'company_hr', 'admin', 'platform', 'ops'];

  const navSections: NavSection[] = [
    {
      title: '工作台',
      items: [
        {
          href: '/',
          label: '仪表盘',
          icon: <LayoutDashboard className="w-5 h-5" />,
          roles: allRoles,
        },
        {
          href: '/search',
          label: '人才搜索',
          icon: <Search className="w-5 h-5" />,
          roles: ['agency_admin', 'company_hr', 'admin'],
          badge: '智能匹配',
        },
        {
          href: '/castings',
          label: '通告中心',
          icon: <Megaphone className="w-5 h-5" />,
          roles: allRoles,
        },
      ],
    },
  ];

  if (role === 'artist') {
    navSections.push({
      title: '我的资料',
      items: [
        {
          href: '/profile',
          label: '个人档案',
          icon: <User className="w-5 h-5" />,
          roles: ['artist'],
        },
        {
          href: '/profile/schedule',
          label: '档期日历',
          icon: <Calendar className="w-5 h-5" />,
          roles: ['artist'],
        },
        {
          href: '/model-cards',
          label: '模卡制作',
          icon: <CreditCard className="w-5 h-5" />,
          roles: ['artist'],
          badge: 'AI 抠图',
        },
      ],
    });
  }

  if (role === 'agency_admin' || role === 'admin' || role === 'platform' || role === 'ops') {
    navSections.push({
      title: '机构管理',
      items: [
        {
          href: '/agency',
          label: '机构概览',
          icon: <Building2 className="w-5 h-5" />,
          roles: ['agency_admin', 'admin'],
        },
        {
          href: '/agency/artists',
          label: '签约艺人',
          icon: <Users className="w-5 h-5" />,
          roles: ['agency_admin', 'admin'],
        },
        {
          href: '/castings/create',
          label: '发布通告',
          icon: <PlusCircle className="w-5 h-5" />,
          roles: ['agency_admin', 'admin'],
        },
        {
          href: '/agency/team',
          label: '团队管理',
          icon: <Users className="w-5 h-5" />,
          roles: ['agency_admin', 'admin'],
        },
        {
          href: '/agency/contacts',
          label: '联系记录',
          icon: <BookOpen className="w-5 h-5" />,
          roles: ['agency_admin', 'admin'],
        },
      ],
    });
  }

  if (role === 'company_hr') {
    navSections.push({
      title: '企业管理',
      items: [
        {
          href: '/castings/create',
          label: '发布招聘',
          icon: <PlusCircle className="w-5 h-5" />,
          roles: ['company_hr'],
        },
        {
          href: '/search',
          label: '人才库',
          icon: <Database className="w-5 h-5" />,
          roles: ['company_hr'],
        },
      ],
    });
  }

  if (role === 'admin' || role === 'platform' || role === 'ops') {
    navSections.push({
      title: '系统管理',
      items: [
        {
          href: '/search',
          label: '用户审核',
          icon: <Shield className="w-5 h-5" />,
          roles: ['admin'],
        },
        {
          href: '/security/logs',
          label: '操作日志',
          icon: <FileText className="w-5 h-5" />,
          roles: ['admin'],
        },
        {
          href: '/agency',
          label: '数据统计',
          icon: <LineChart className="w-5 h-5" />,
          roles: ['admin'],
        },
      ],
    });
  }

  navSections.push({
    title: '设置',
    items: [
      {
        href: '/security',
        label: '数据安全',
        icon: <Shield className="w-5 h-5" />,
        roles: allRoles,
      },
      {
        href: '/settings',
        label: '系统设置',
        icon: <Settings className="w-5 h-5" />,
        roles: allRoles,
      },
    ],
  });

  return navSections;
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, artistProfile, logout } = useAuthStore();
  const toast = useToast();

  const navSections = getNavSections(user?.role);

  const filteredSections = navSections.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => !item.roles || !user?.role || item.roles.includes(user.role)
    ),
  })).filter((section) => section.items.length > 0);

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const displayName = artistProfile?.stageName || user?.email?.split('@')[0] || '用户';
  const avatarUrl = artistProfile?.mediaAssets?.find((m) => m.isPrimary)?.url;

  const handleLogout = () => {
    logout();
    toast.success('已退出登录', '期待您的再次归来');
    navigate('/login', { replace: true });
  };

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
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ease-out-expo group relative',
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
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="font-medium text-sm whitespace-nowrap animate-fade-in">
                      {item.label}
                    </span>
                    {item.badge && (
                      <Badge
                        variant={isActive(item.href) ? 'default' : 'secondary'}
                        size="sm"
                        className="ml-2"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-midnight-800 text-white text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg border border-midnight-700">
                    {item.label}
                    {item.badge && (
                      <span className="ml-2 text-xs text-sapphire-400">{item.badge}</span>
                    )}
                  </div>
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
                  <Badge
                    variant={['admin', 'platform', 'ops'].includes(user?.role as string) ? 'danger' : 'primary'}
                    size="sm"
                    dot
                  >
                    {user?.role ? roleLabels[user.role] : 'Guest'}
                  </Badge>
                </div>
              </div>
            )}
            {!collapsed ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="p-2 text-midnight-400 hover:text-rose-400 hover:bg-midnight-700"
                title="退出登录"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            ) : (
              <button
                onClick={handleLogout}
                className="p-2 text-midnight-400 hover:text-rose-400 hover:bg-midnight-700 rounded-lg transition-all duration-300"
                title="退出登录"
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
