import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Search,
  Bell,
  ChevronRight,
  User,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

const breadcrumbMap: Record<string, string> = {
  '': '首页',
  sanxiaxiang: '三下乡专项',
  teams: '团队管理',
  checkin: '轨迹打卡',
  journals: '日志管理',
  scholarship: '奖学金',
  projects: '资助项目',
  stories: '受助故事',
  news: '资讯引擎',
  activities: '实践活动',
  bases: '实践基地',
  credits: '学分认证',
  apply: '申请认证',
  dashboard: '数据看板',
  settings: '系统设置',
};

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const pathSegments = location.pathname.split('/').filter(Boolean);

  const breadcrumbs = pathSegments.map((segment, index) => ({
    label: breadcrumbMap[segment] || segment,
    path: '/' + pathSegments.slice(0, index + 1).join('/'),
  }));

  if (breadcrumbs.length === 0) {
    breadcrumbs.unshift({ label: '首页', path: '/' });
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const notifications = [
    { id: 1, title: '团队审核通过', desc: '你的"科技助农"团队已通过审核', time: '5分钟前', read: false },
    { id: 2, title: '新的打卡提醒', desc: '今日尚未进行轨迹打卡', time: '1小时前', read: false },
    { id: 3, title: '奖学金申请截止', desc: '赵科技助学金将于3天后截止', time: '2小时前', read: true },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-surface-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-surface-500 hover:bg-surface-100 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.path} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-surface-400" />}
              {index === breadcrumbs.length - 1 ? (
                <span className="font-medium text-surface-800">{crumb.label}</span>
              ) : (
                <button
                  onClick={() => navigate(crumb.path)}
                  className="text-surface-500 hover:text-primary-600"
                >
                  {crumb.label}
                </button>
              )}
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex items-center rounded-full border bg-surface-50 transition-all duration-300',
            searchFocused ? 'w-64 border-primary-300 ring-2 ring-primary-100' : 'w-44 border-surface-200'
          )}
        >
          <Search className="ml-3 h-4 w-4 text-surface-400" />
          <input
            type="text"
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="flex-1 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-surface-400"
          />
        </div>

        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative rounded-lg p-2 text-surface-500 hover:bg-surface-100"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-surface-200 bg-white shadow-elevated"
              >
                <div className="border-b border-surface-100 px-4 py-3">
                  <h3 className="text-sm font-semibold text-surface-800">通知</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        'flex gap-3 px-4 py-3 transition-colors hover:bg-surface-50',
                        !notif.read && 'bg-primary-50/50'
                      )}
                    >
                      <div
                        className={cn(
                          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                          notif.read ? 'bg-surface-300' : 'bg-primary-500'
                        )}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-surface-800">{notif.title}</p>
                        <p className="truncate text-xs text-surface-500">{notif.desc}</p>
                        <p className="mt-0.5 text-xs text-surface-400">{notif.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-surface-100 px-4 py-2">
                  <button className="text-xs font-medium text-primary-600 hover:text-primary-700">
                    查看全部通知
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-100"
          >
            <img
              src={user?.avatar || ''}
              alt={user?.name || ''}
              className="h-7 w-7 rounded-full object-cover"
            />
            <span className="hidden text-sm font-medium text-surface-700 md:inline">
              {user?.name}
            </span>
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-surface-200 bg-white shadow-elevated"
              >
                <div className="border-b border-surface-100 px-4 py-3">
                  <p className="text-sm font-medium text-surface-800">{user?.name}</p>
                  <p className="text-xs text-surface-500">{user?.email}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-700 hover:bg-surface-100"
                  >
                    <User className="h-4 w-4" />
                    个人资料
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-700 hover:bg-surface-100"
                  >
                    <Settings className="h-4 w-4" />
                    系统设置
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger-600 hover:bg-danger-50"
                  >
                    <LogOut className="h-4 w-4" />
                    退出登录
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
