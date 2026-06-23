import { Bell, Search, Settings, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  title: string;
  onMenuToggle?: () => void;
}

const Header = ({ title, onMenuToggle }: HeaderProps) => {
  const [searchValue, setSearchValue] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, type: 'success', title: '房源审核通过', message: '您录入的"朝阳区万科城市花园3室2厅"已审核通过', time: '5分钟前' },
    { id: 2, type: 'info', title: '新抢单机会', message: '海淀区有一个匹配度92%的购房需求', time: '15分钟前' },
    { id: 3, type: 'warning', title: '相似度预警', message: '检测到3条与您录入房源相似的信息', time: '1小时前' },
  ];

  return (
    <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-zinc-100 transition-colors"
        >
          <Menu className="w-5 h-5 text-zinc-600" />
        </button>
        <h2 className="text-xl font-serif font-semibold text-zinc-800">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="搜索房源、客源、需求..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 pr-4 py-2 w-80 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <Bell className="w-5 h-5 text-zinc-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full animate-pulse-soft"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-float border border-zinc-100 overflow-hidden z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-zinc-100 bg-gradient-to-r from-zinc-50 to-white">
                <h3 className="font-semibold text-zinc-800">通知中心</h3>
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {notifications.map((notif, index) => (
                  <div
                    key={notif.id}
                    className="px-4 py-3 border-b border-zinc-50 hover:bg-zinc-50 transition-colors cursor-pointer"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                          notif.type === 'success'
                            ? 'bg-success-500'
                            : notif.type === 'warning'
                            ? 'bg-gold-500'
                            : 'bg-info-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-800">{notif.title}</p>
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{notif.message}</p>
                        <p className="text-xs text-zinc-400 mt-1">{notif.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-zinc-100">
                <button className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium">
                  查看全部通知
                </button>
              </div>
            </div>
          )}
        </div>

        <button className="p-2 rounded-lg hover:bg-zinc-100 transition-colors">
          <Settings className="w-5 h-5 text-zinc-600" />
        </button>
      </div>
    </header>
  );
};

export default Header;
