import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Search,
  Bell,
  MessageSquare,
  User,
  Settings,
  Shield,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

import { Input } from '@/components/ui/Input';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  'talent-search': 'Talent Search',
  castings: 'Castings',
  profile: 'My Profile',
  schedule: 'My Schedule',
  'model-cards': 'Model Cards',
  artists: 'My Artists',
  'publish-casting': 'Publish Casting',
  team: 'Team',
  security: 'Security',
  settings: 'Settings',
};

interface HeaderProps {
  sidebarCollapsed: boolean;
  onMenuToggle?: () => void;
}

export function Header({ sidebarCollapsed, onMenuToggle }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, artistProfile, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [messages, setMessages] = useState(5);

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

    let currentPath = '';
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`;
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({ label, href: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const displayName = artistProfile?.stageName || user?.email?.split('@')[0] || 'User';
  const avatarUrl = artistProfile?.mediaAssets?.find((m) => m.isPrimary)?.url;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 z-30 transition-all duration-300 ease-out-expo',
        sidebarCollapsed ? 'left-20' : 'left-64 md:left-64 left-0'
      )}
    >
      <div className="h-full glass backdrop-blur-xl border-b border-white/10 px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
              onMenuToggle?.();
            }}
            className="md:hidden p-2 text-midnight-300 hover:text-white hover:bg-midnight-700/50 rounded-lg transition-all duration-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <nav className="hidden md:flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.label + index} className="flex items-center gap-2">
                {index > 0 && <ChevronRight className="w-4 h-4 text-midnight-500" />}
                {crumb.href && index < breadcrumbs.length - 1 ? (
                  <Link
                    to={crumb.href}
                    className="text-midnight-400 hover:text-white transition-colors duration-300"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-white font-medium">{crumb.label}</span>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <div className="w-80">
            <Input
              placeholder="Search talent, castings..."
              variant="filled"
              size="sm"
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <button className="relative p-2.5 text-midnight-400 hover:text-white hover:bg-midnight-700/50 rounded-xl transition-all duration-300 group">
            <Bell className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            {notifications > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full">
                {notifications > 99 ? '99+' : notifications}
              </span>
            )}
          </button>

          <button className="relative p-2.5 text-midnight-400 hover:text-white hover:bg-midnight-700/50 rounded-xl transition-all duration-300 group">
            <MessageSquare className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            {messages > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-sapphire-400 rounded-full">
                {messages > 99 ? '99+' : messages}
              </span>
            )}
          </button>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-2 md:gap-3 p-1.5 md:p-2 hover:bg-midnight-700/50 rounded-xl transition-all duration-300">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover border-2 border-rose-500/30"
                    />
                  ) : (
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-semibold">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-midnight-800 rounded-full" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-white leading-tight">{displayName}</p>
                  <p className="text-xs text-midnight-400">{user?.email}</p>
                </div>
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="w-56 p-2 mt-2 bg-midnight-800 border border-midnight-600 rounded-xl shadow-glass backdrop-blur-xl animate-fade-in-down z-50"
                align="end"
                sideOffset={8}
              >
                <DropdownMenu.Item className="outline-none">
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-midnight-200 hover:text-white hover:bg-midnight-700/50 rounded-lg transition-all duration-200"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">View Profile</span>
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Item className="outline-none">
                  <Link
                    to="/security"
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-midnight-200 hover:text-white hover:bg-midnight-700/50 rounded-lg transition-all duration-200"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">Security</span>
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Item className="outline-none">
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-midnight-200 hover:text-white hover:bg-midnight-700/50 rounded-lg transition-all duration-200"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm font-medium">Settings</span>
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="h-px bg-midnight-600 my-2" />

                <DropdownMenu.Item className="outline-none">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all duration-200"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 p-4 glass backdrop-blur-xl border-b border-white/10 animate-fade-in-down">
          <Input
            placeholder="Search talent, castings..."
            variant="filled"
            size="md"
            leftIcon={<Search className="w-5 h-5" />}
            className="mb-3"
          />
          <nav className="flex items-center gap-2 text-sm overflow-x-auto pb-1">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.label + index} className="flex items-center gap-2 flex-shrink-0">
                {index > 0 && <ChevronRight className="w-4 h-4 text-midnight-500" />}
                {crumb.href && index < breadcrumbs.length - 1 ? (
                  <Link
                    to={crumb.href}
                    className="text-midnight-400 hover:text-white transition-colors duration-300"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-white font-medium">{crumb.label}</span>
                )}
              </div>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
