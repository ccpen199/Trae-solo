import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Sparkles,
  MessageSquare,
  User,
  Building2,
  Users,
  LayoutDashboard,
  ChevronDown,
  LogOut,
  Settings,
  Bell,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import type { UserRole, Student, Company, Admin } from '../../shared/types';

type User = Student | Company | Admin;

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const studentNavItems: NavItem[] = [
  { label: '岗位大厅', path: '/', icon: Briefcase },
  { label: '智能匹配', path: '/match', icon: Sparkles },
  { label: '消息', path: '/messages', icon: MessageSquare },
  { label: '我的', path: '/student/profile', icon: User },
];

const companyNavItems: NavItem[] = [
  { label: '岗位大厅', path: '/', icon: Briefcase },
  { label: '我的岗位', path: '/company/jobs', icon: Building2 },
  { label: '候选人', path: '/company/candidates', icon: Users },
  { label: '消息', path: '/messages', icon: MessageSquare },
];

const adminNavItems: NavItem[] = [
  { label: '监管看板', path: '/admin', icon: LayoutDashboard },
];

function getNavItems(role: UserRole | null): NavItem[] {
  switch (role) {
    case 'student':
      return studentNavItems;
    case 'company':
      return companyNavItems;
    case 'admin':
      return adminNavItems;
    default:
      return [];
  }
}

function getUserName(user: User | null, role: UserRole | null): string {
  if (!user || !role) return '';
  if (role === 'student') return (user as Student).name;
  if (role === 'company') return (user as Company).name;
  if (role === 'admin') return (user as Admin).name;
  return '';
}

function getUserAvatar(user: User | null, role: UserRole | null): string | undefined {
  if (!user || !role) return undefined;
  if (role === 'student') return (user as Student).avatar;
  if (role === 'company') return (user as Company).avatar;
  return undefined;
}

export default function Navbar() {
  const { user, userRole, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = getNavItems(userRole);
  const userName = getUserName(user, userRole);
  const userAvatar = getUserAvatar(user, userRole);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">实习兼职平台</span>
            </Link>

            {user && navItems.length > 0 && (
              <div className="hidden md:flex ml-10 space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.path === '/'
                      ? window.location.pathname === '/'
                      : window.location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        isActive
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      )}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                        {userName.charAt(0)}
                      </div>
                    )}
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-gray-500 transition-transform',
                        dropdownOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{userName}</p>
                        <p className="text-xs text-gray-500 capitalize">{userRole}</p>
                      </div>

                      <Link
                        to={
                          userRole === 'student'
                            ? '/student/profile'
                            : userRole === 'company'
                            ? '/company/profile'
                            : '/admin/settings'
                        }
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <User className="w-4 h-4 mr-3" />
                        个人中心
                      </Link>

                      <button
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        设置
                      </button>

                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          退出登录
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
