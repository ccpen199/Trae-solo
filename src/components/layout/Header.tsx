import { useState } from 'react';
import { Search, Bell, User, Settings, ChevronDown, X } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { formatNumber } from '../../utils/format';
import { cn } from '../../lib/utils';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { searchKeyword, setSearchKeyword, unreadCount, alerts, markAlertRead, markAllAlertsRead } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadAlerts = alerts.filter(a => a.status === 'unread').slice(0, 5);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-danger-500';
      case 'medium': return 'bg-warning-500';
      case 'low': return 'bg-brand-500';
      default: return 'bg-dark-500';
    }
  };

  return (
    <header className={cn(
      'h-16 bg-dark-900/60 backdrop-blur-xl border-b border-dark-700/50 flex items-center justify-between px-6',
      className
    )}>
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96 max-w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            type="text"
            placeholder="搜索企业、人物、项目、新闻..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full h-9 pl-10 pr-4 text-sm bg-dark-800/50 border border-dark-700/50 rounded-lg text-dark-200 placeholder:text-dark-500 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/10 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] text-dark-500 bg-dark-700/50 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className={cn(
              'relative p-2 rounded-lg transition-colors',
              showNotifications 
                ? 'bg-dark-800 text-brand-400' 
                : 'text-dark-400 hover:bg-dark-800/50 hover:text-dark-200'
            )}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-dark-800 border border-dark-700/50 rounded-xl shadow-2xl shadow-black/30 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700/50">
                <h3 className="text-sm font-semibold text-white">预警通知</h3>
                <button
                  onClick={markAllAlertsRead}
                  className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                >
                  全部已读
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {unreadAlerts.length > 0 ? (
                  unreadAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => markAlertRead(alert.id)}
                      className="px-4 py-3 border-b border-dark-700/30 hover:bg-dark-700/30 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                          getLevelColor(alert.level)
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{alert.title}</p>
                          <p className="text-xs text-dark-400 mt-1 line-clamp-2">{alert.description}</p>
                          <p className="text-xs text-dark-500 mt-1.5">{alert.createTime}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-sm text-dark-500">暂无未读通知</p>
                  </div>
                )}
              </div>
              <div className="px-4 py-3 border-t border-dark-700/50">
                <button className="w-full text-sm text-brand-400 hover:text-brand-300 transition-colors">
                  查看全部预警
                </button>
              </div>
            </div>
          )}
        </div>

        <button className="p-2 rounded-lg text-dark-400 hover:bg-dark-800/50 hover:text-dark-200 transition-colors">
          <Settings className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-dark-700/50" />

        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-dark-800/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-white">分析师</p>
              <p className="text-xs text-dark-400">投研机构</p>
            </div>
            <ChevronDown className="w-4 h-4 text-dark-500" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-dark-800 border border-dark-700/50 rounded-xl shadow-2xl shadow-black/30 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-dark-700/50">
                <p className="text-sm font-medium text-white">分析师账号</p>
                <p className="text-xs text-dark-400 mt-0.5">专业版订阅</p>
              </div>
              <div className="py-1">
                <button className="w-full px-4 py-2 text-left text-sm text-dark-300 hover:bg-dark-700/50 hover:text-white transition-colors">
                  个人中心
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-dark-300 hover:bg-dark-700/50 hover:text-white transition-colors">
                  账户设置
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-dark-300 hover:bg-dark-700/50 hover:text-white transition-colors">
                  我的收藏
                </button>
              </div>
              <div className="border-t border-dark-700/50 py-1">
                <button className="w-full px-4 py-2 text-left text-sm text-danger-400 hover:bg-dark-700/50 transition-colors">
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
