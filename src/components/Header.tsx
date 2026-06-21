import { Bell, Search, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: '新简历投递', message: '高级前端开发工程师收到3份新简历', time: '5分钟前', unread: true },
    { id: 2, title: '面试提醒', message: '明天上午10:00 张*明 面试', time: '2小时前', unread: true },
    { id: 3, title: '认证通过', message: '您的企业认证已通过审核', time: '昨天', unread: false },
  ];

  return (
    <header className="h-16 bg-white border-b border-ash-100 px-8 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h2 className="font-serif font-bold text-xl text-ash-700">{title}</h2>
        {subtitle && <p className="text-sm text-ash-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-72">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ash-400" />
          <input
            type="text"
            placeholder="搜索职位、简历、候选人..."
            className="w-full pl-10 pr-4 py-2 bg-ash-50 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/30"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-ash-50 transition-colors"
          >
            <Bell size={20} className="text-ash-500" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-terracotta-500 rounded-full"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-elevated border border-ash-100 overflow-hidden animate-fade-in">
              <div className="p-4 border-b border-ash-100">
                <h3 className="font-semibold text-ash-700">消息通知</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 border-b border-ash-50 hover:bg-ash-50 cursor-pointer ${
                      n.unread ? 'bg-terracotta-50/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {n.unread && (
                        <span className="w-2 h-2 mt-2 bg-terracotta-500 rounded-full flex-shrink-0"></span>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ash-700">{n.title}</p>
                        <p className="text-xs text-ash-500 mt-0.5">{n.message}</p>
                        <p className="text-xs text-ash-400 mt-1">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 text-center">
                <button className="text-sm text-terracotta-600 font-medium hover:text-terracotta-700">
                  查看全部通知
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pl-4 border-l border-ash-100 cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-spruce-400 to-spruce-600 flex items-center justify-center text-white font-medium text-sm">
            云
          </div>
          <ChevronDown size={16} className="text-ash-400" />
        </div>
      </div>
    </header>
  );
}
