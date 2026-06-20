import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  User,
  Settings as SettingsIcon,
  LogOut,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { User as UserType } from '@shared/types';

interface Notification {
  id: string;
  title: string;
  content: string;
  read: boolean;
  createdAt: Date;
  type: 'message' | 'match' | 'system';
}

interface TopbarProps {
  onToggleSidebar: () => void;
  user: UserType;
  notifications: Notification[];
}

export function Topbar({ onToggleSidebar, user, notifications }: TopbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/login');
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return <div className="w-2 h-2 rounded-full bg-mint-500" />;
      case 'match':
        return <div className="w-2 h-2 rounded-full bg-accent-500" />;
      case 'system':
        return <div className="w-2 h-2 rounded-full bg-primary-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-neutral-200">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-neutral-700" />
          </button>

          <nav className="hidden md:flex items-center gap-2 text-sm text-neutral-500">
            <Link to="/" className="hover:text-primary-600 transition-colors">
              首页
            </Link>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-700 font-medium">工作台</span>
          </nav>
        </div>

        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索职位、候选人..."
              className="w-full pl-10 pr-10 py-2 bg-neutral-100 border border-transparent rounded-xl text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:border-primary-200 focus:ring-2 focus:ring-primary-100 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-neutral-200 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-neutral-400" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className={cn(
                'relative p-2.5 rounded-xl transition-all duration-200',
                showNotifications
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-primary-600'
              )}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-accent-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-card-hover border border-neutral-200 overflow-hidden animate-fade-in">
                <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
                  <h3 className="font-semibold text-neutral-800">通知中心</h3>
                  <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                    全部已读
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-neutral-500 text-sm">
                      暂无通知
                    </div>
                  ) : (
                    <ul>
                      {notifications.slice(0, 5).map((notification) => (
                        <li
                          key={notification.id}
                          className={cn(
                            'px-4 py-3 border-b border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer',
                            !notification.read && 'bg-primary-50/50'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-2">{getNotificationIcon(notification.type)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-neutral-800">
                                {notification.title}
                              </p>
                              <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
                                {notification.content}
                              </p>
                              <p className="text-xs text-neutral-400 mt-1">
                                {notification.createdAt.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="px-4 py-3 border-t border-neutral-200">
                  <button className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium">
                    查看全部通知
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className={cn(
                'flex items-center gap-2 p-1.5 pr-3 rounded-xl transition-all duration-200',
                showUserMenu ? 'bg-primary-50' : 'hover:bg-neutral-100'
              )}
            >
              <div className="relative">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-mint-400 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-mint-500 border-2 border-white rounded-full" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-neutral-800">{user.name}</p>
                <p className="text-xs text-neutral-500 capitalize">{user.role}</p>
              </div>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-neutral-400 transition-transform duration-200',
                  showUserMenu && 'rotate-180'
                )}
              />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-card-hover border border-neutral-200 overflow-hidden animate-fade-in">
                <div className="px-4 py-3 border-b border-neutral-200">
                  <p className="text-sm font-medium text-neutral-800">{user.name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{user.email}</p>
                </div>
                <ul className="p-2">
                  <li>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/profile');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-neutral-700 hover:bg-neutral-100 hover:text-primary-600 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      个人资料
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-neutral-700 hover:bg-neutral-100 hover:text-primary-600 transition-colors"
                    >
                      <SettingsIcon className="w-4 h-4" />
                      账号设置
                    </button>
                  </li>
                </ul>
                <div className="p-2 border-t border-neutral-200">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-accent-600 hover:bg-accent-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
