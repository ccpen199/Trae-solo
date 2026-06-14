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
  GraduationCap,
  ShieldCheck,
  BadgeCheck,
  FileCheck2,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import type { UserRole, Student, Company, Admin } from '../../shared/types';

type UserType = Student | Company | Admin;

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const studentNavItems: NavItem[] = [
  { label: '岗位大厅', path: '/', icon: Briefcase },
  { label: '智能匹配', path: '/match', icon: Sparkles },
  { label: '消息中心', path: '/messages', icon: MessageSquare },
  { label: '学生中心', path: '/student/profile', icon: User },
];

const companyNavItems: NavItem[] = [
  { label: '岗位大厅', path: '/', icon: Briefcase },
  { label: '我的岗位', path: '/company/jobs', icon: Building2 },
  { label: '候选人', path: '/company/candidates', icon: Users },
  { label: '消息中心', path: '/messages', icon: MessageSquare },
];

const adminNavItems: NavItem[] = [
  { label: '监管总览', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: '院校监控', path: '/admin/schools', icon: Building2 },
  { label: '投诉处理', path: '/admin/complaints', icon: FileCheck2 },
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

function getRoleLabel(role: UserRole | null): string {
  switch (role) {
    case 'student': return '学生';
    case 'company': return '企业';
    case 'admin': return '教育局监管';
    default: return '';
  }
}

function getRoleBadgeClass(role: UserRole | null): string {
  switch (role) {
    case 'student': return 'bg-primary-100 text-primary-700 border-primary-200';
    case 'company': return 'bg-accent-100 text-accent-700 border-accent-200';
    case 'admin': return 'bg-success-100 text-success-700 border-success-200';
    default: return '';
  }
}

function getRoleIcon(role: UserRole | null) {
  switch (role) {
    case 'student': return GraduationCap;
    case 'company': return Building2;
    case 'admin': return ShieldCheck;
    default: return User;
  }
}

function getUserName(user: UserType | null, role: UserRole | null): string {
  if (!user || !role) return '';
  if (role === 'student') return (user as Student).name;
  if (role === 'company') return (user as Company).name;
  if (role === 'admin') return (user as Admin).name;
  return '';
}

function getUserAvatar(user: UserType | null, role: UserRole | null): string | undefined {
  if (!user || !role) return undefined;
  if (role === 'student') return (user as Student).avatar;
  if (role === 'company') return (user as Company).avatar;
  return undefined;
}

function getUserSubInfo(user: UserType | null, role: UserRole | null): string {
  if (!user || !role) return '';
  if (role === 'student') return (user as Student).school || '';
  if (role === 'company') return (user as Company).contactName || '企业账号';
  if (role === 'admin') return '教育局管理员';
  return '';
}

export default function Navbar() {
  const { user, userRole, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = getNavItems(userRole);
  const userName = getUserName(user, userRole);
  const userAvatar = getUserAvatar(user, userRole);
  const userSubInfo = getUserSubInfo(user, userRole);
  const RoleIcon = getRoleIcon(userRole);

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

  const getProfilePath = () => {
    switch (userRole) {
      case 'student': return '/student/profile';
      case 'company': return '/company/profile';
      case 'admin': return '/admin/dashboard';
      default: return '/login';
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-sm shadow-primary-500/20">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-gray-900 leading-tight">校职通</span>
                <span className="text-[10px] text-gray-400 leading-tight">高校兼职用工撮合平台</span>
              </div>
            </Link>

            {user && userRole && (
              <div className="ml-6 pl-6 border-l border-gray-100 hidden md:flex items-center space-x-2">
                <div className={cn(
                  'inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs font-medium',
                  getRoleBadgeClass(userRole)
                )}>
                  <RoleIcon className="w-3.5 h-3.5" />
                  <span>{getRoleLabel(userRole)}端</span>
                </div>
              </div>
            )}

            {user && navItems.length > 0 && (
              <div className="hidden md:flex ml-8 space-x-1">
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
                        'flex items-center px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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

          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2.5 p-1 pr-3 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userName}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-medium ring-2 ring-gray-100">
                        {userName.charAt(0)}
                      </div>
                    )}
                    <div className="text-left hidden sm:block">
                      <p className="text-sm font-medium text-gray-800 leading-tight">{userName}</p>
                      <p className="text-xs text-gray-400 leading-tight">{userSubInfo}</p>
                    </div>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-gray-400 transition-transform',
                        dropdownOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 py-2 z-50 animate-fade-in-up">
                      <div className="px-4 py-4 border-b border-gray-50">
                        <div className="flex items-center space-x-3">
                          {userAvatar ? (
                            <img
                              src={userAvatar}
                              alt={userName}
                              className="w-12 h-12 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-base font-medium">
                              {userName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{userName}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{userSubInfo}</p>
                            <div className="mt-1.5">
                              <span className={cn(
                                'inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium border',
                                getRoleBadgeClass(userRole)
                              )}>
                                <RoleIcon className="w-3 h-3" />
                                <span>{getRoleLabel(userRole)}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          to={getProfilePath()}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <User className="w-4 h-4 mr-3 text-gray-400" />
                          个人中心
                        </Link>
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            navigate('/settings');
                          }}
                          className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
                        >
                          <Settings className="w-4 h-4 mr-3 text-gray-400" />
                          账号设置
                        </button>
                      </div>

                      <div className="border-t border-gray-50 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
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
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  登录
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-sm shadow-primary-500/20"
                >
                  注册账号
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
