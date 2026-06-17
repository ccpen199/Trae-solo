import { Bell, Search, User, Menu, X, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
}

const allSearchServices = [
  { name: 'BRT乘车码', path: '/transportation/brt', category: '交通出行', keywords: '公交,扫码,BRT,乘车' },
  { name: '智慧停车', path: '/transportation/parking', category: '交通出行', keywords: '停车,泊位,缴费' },
  { name: '违章查询', path: '/transportation/violation', category: '交通出行', keywords: '违章,处罚,驾驶证,扣分' },
  { name: '预约挂号', path: '/medical/appointment', category: '医疗健康', keywords: '医院,挂号,看病,就诊' },
  { name: '候诊热力图', path: '/medical/heatmap', category: '医疗健康', keywords: '医院,候诊,热力图,排队' },
  { name: '入学报名', path: '/education/enrollment', category: '教育服务', keywords: '小学,入学,报名,招生,学区' },
  { name: '政策解读', path: '/government/policy', category: '政务服务', keywords: '政策,解读,通知,文件' },
  { name: '12345诉求', path: '/urban/complaint', category: '城市管理', keywords: '投诉,12345,诉求,工单,举报' },
  { name: '数字身份中心', path: '/identity', category: '数字身份', keywords: '身份证,电子证照,社保卡,驾驶证' },
  { name: '市民首页', path: '/', category: '首页', keywords: '首页,首页,推荐' },
];

export default function Header({ onMenuToggle, sidebarOpen }: HeaderProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [notifications] = useState([
    { id: 1, title: '您的预约即将开始', time: '5分钟前', type: 'medical' },
    { id: 2, title: '小学入学报名已开放', time: '1小时前', type: 'education' },
    { id: 3, title: '违章处理提醒', time: '2小时前', type: 'transportation' },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  const searchResults = searchQuery.trim()
    ? allSearchServices.filter(s =>
      s.name.includes(searchQuery) ||
      s.category.includes(searchQuery) ||
      s.keywords.split(',').some(k => k.includes(searchQuery))
    )
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length === 1) {
      navigate(searchResults[0].path);
      setShowSearchDropdown(false);
      setSearchQuery('');
    } else if (searchResults.length > 1) {
      navigate(searchResults[0].path);
      setShowSearchDropdown(false);
    }
  };

  const handleServiceClick = (path: string) => {
    navigate(path);
    setShowSearchDropdown(false);
    setSearchQuery('');
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
            placeholder="搜索服务：乘车码、挂号、入学、违章、停车..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSearchDropdown(true); }}
            onFocus={() => { setSearchFocused(true); setShowSearchDropdown(true); }}
            onBlur={() => { setSearchFocused(false); setTimeout(() => setShowSearchDropdown(false), 200); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchSubmit(e as any);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300"
          />
          {showSearchDropdown && searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-gray-100 bg-white shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto animate-fade-in">
              {searchResults.length > 0 ? (
                <>
                  <div className="px-4 py-2 border-b border-gray-50">
                    <p className="text-xs text-gray-400">找到 {searchResults.length} 个相关服务</p>
                  </div>
                  {searchResults.map(svc => (
                    <button
                      key={svc.path}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleServiceClick(svc.path)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 text-left border-b border-gray-50 last:border-0 transition-colors"
                    >
                      <div>
                        <span className="text-sm font-medium text-gray-800">{svc.name}</span>
                        <span className="text-xs text-gray-400 ml-2">{svc.category}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </button>
                  ))}
                </>
              ) : (
                <div className="px-4 py-6 text-center text-gray-400 text-sm">
                  未找到匹配服务，试试其他关键词
                </div>
              )}
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
