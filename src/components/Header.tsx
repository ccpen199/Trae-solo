import { Bell, Search, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
}

export default function Header({ onMenuToggle, sidebarOpen }: HeaderProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState('');
  const [notifications] = useState([
    { id: 1, title: '您的预约即将开始', time: '5分钟前', type: 'medical' },
    { id: 2, title: '小学入学报名已开放', time: '1小时前', type: 'education' },
    { id: 3, title: '违章处理提醒', time: '2小时前', type: 'transportation' },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSearch = () => {
    const query = searchQuery.trim();
    if (!query) return;
    setSearchResult(query);
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-lg border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className={cn(
          'relative transition-all duration-300',
          searchFocused ? 'w-96' : 'w-64'
        )}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索服务、医院、学校、政策..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full pl-10 pr-16 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300"
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleSearch}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
          >
            搜索
          </button>
          {searchResult && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-gray-100 bg-white p-4 shadow-card z-50">
              <p className="text-sm font-semibold text-gray-800">搜索结果</p>
              <p className="mt-1 text-xs text-gray-500">已为“{searchResult}”匹配服务、医院、学校与政策。</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => navigate('/government/policy')} className="rounded-lg bg-gray-50 px-3 py-2 text-left text-gray-700 hover:bg-primary-50">政策查询结果</button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => navigate('/transportation/violation')} className="rounded-lg bg-gray-50 px-3 py-2 text-left text-gray-700 hover:bg-primary-50">交通服务结果</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden z-50 animate-fade-in">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">消息通知</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-4 hover:bg-gray-50 border-b border-gray-50 cursor-pointer transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-gray-100">
                <button className="w-full text-sm text-primary-600 font-medium hover:text-primary-700">
                  查看全部通知
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 pl-4 border-l border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
            {user?.name?.charAt(0) || '用'}
          </div>
          <div className="hidden md:block">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-800">{user?.name || '用户'}</p>
              {user?.role === 'admin' && (
                <span className="px-2 py-0.5 bg-warm-100 text-warm-700 text-xs font-medium rounded-full">
                  管理员
                </span>
              )}
              {user?.role === 'clerk' && (
                <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                  办事员
                </span>
              )}
              {user?.role === 'citizen' && (
                <span className="px-2 py-0.5 bg-eco-100 text-eco-700 text-xs font-medium rounded-full">
                  市民
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={cn(
                'w-1.5 h-1.5 rounded-full',
                user?.realNameVerified ? 'bg-eco-500' : 'bg-warm-500'
              )}></span>
              <span className="text-xs text-gray-500">
                {user?.realNameVerified ? '已实名认证' : '未实名认证'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
