import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  Search,
  ChevronDown,
  LogOut,
  User,
  Settings as SettingsIcon,
  MessageSquare,
} from 'lucide-react';
import { Badge, Dropdown, Avatar } from 'antd';
import { useUserStore } from '@/store/userStore';
import { formatRelativeTime } from '@/utils/format';

const mockNotifications = [
  { id: 1, type: 'case', title: '新案源匹配', content: '有3个新案源符合您的专长领域', time: '2024-03-21T10:30:00Z', unread: true },
  { id: 2, type: 'task', title: '任务提醒', content: '您有2个任务即将到期', time: '2024-03-21T09:15:00Z', unread: true },
  { id: 3, type: 'contract', title: '合同待签署', content: '北京中科创新案源合同待您签署', time: '2024-03-20T16:00:00Z', unread: false },
  { id: 4, type: 'court', title: '开庭提醒', content: '案件(2024)京01民初123号明日开庭', time: '2024-03-20T08:00:00Z', unread: true },
];

const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUserStore();
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const getBreadcrumb = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const names: Record<string, string> = {
      '': '首页',
      'search': '大数据检索',
      'company': '企业详情',
      'reports': '报告中心',
      'developers': 'API管理',
      'cases': '案源市场',
      'publish': '发布案源',
      'bidding': '竞标大厅',
      'contracts': '合同签署',
      'workspace': '办案中台',
      'board': '任务看板',
      'evidence': '证据库',
      'tools': '工具中心',
      'calculator': '法律计算器',
      'ai': '法条助手',
      'templates': '文书模板',
      'team': '团队管理',
      'finance': '财务中心',
      'settings': '个人设置',
    };

    return paths.map((p, i) => ({
      name: names[p] || p,
      path: '/' + paths.slice(0, i + 1).join('/'),
    }));
  };

  const breadcrumb = getBreadcrumb();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      navigate(`/search?keyword=${encodeURIComponent(searchKeyword)}`);
      setSearchKeyword('');
      setSearchVisible(false);
    }
  };

  const userMenu = [
    {
      key: 'profile',
      icon: <User className="w-4 h-4" />,
      label: '个人信息',
      onClick: () => navigate('/settings'),
    },
    {
      key: 'settings',
      icon: <SettingsIcon className="w-4 h-4" />,
      label: '账号设置',
      onClick: () => navigate('/settings'),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogOut className="w-4 h-4" />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const notificationMenu = mockNotifications.map(n => ({
    key: n.id,
    label: (
      <div className="py-2 min-w-80">
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-2 h-2 rounded-full mt-2 flex-shrink-0',
            n.unread ? 'bg-accent-red' : 'bg-transparent'
          )} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className={cn('font-medium text-sm', n.unread && 'text-primary-900')}>{n.title}</span>
              <span className="text-xs text-neutral-ink-500">{formatRelativeTime(n.time)}</span>
            </div>
            <p className="text-sm text-neutral-ink-600 mt-1">{n.content}</p>
          </div>
        </div>
      </div>
    ),
  }));

  const unreadCount = mockNotifications.filter(n => n.unread).length;

  return (
    <header className="h-16 bg-white border-b border-neutral-ink-100 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-neutral-ink-500">当前位置：</span>
          {breadcrumb.map((item, i) => (
            <React.Fragment key={item.path}>
              {i > 0 && <span className="text-neutral-ink-300">/</span>}
              <span className={cn(
                i === breadcrumb.length - 1 ? 'text-primary-900 font-medium' : 'text-neutral-ink-500 hover:text-primary-500 cursor-pointer'
              )}>
                {item.name}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <form onSubmit={handleSearch} className={cn(
          'flex items-center gap-2 overflow-hidden transition-all duration-300',
          searchVisible ? 'w-80' : 'w-10'
        )}>
          <div className="relative flex-1">
            <Search className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-ink-400 transition-opacity',
              searchVisible ? 'opacity-100' : 'opacity-0'
            )} />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索企业、案件、律师..."
              className={cn(
                'w-full pl-10 pr-4 py-2 bg-neutral-ivory border border-neutral-ink-200 rounded-lg transition-all',
                searchVisible ? 'opacity-100' : 'opacity-0'
              )}
            />
          </div>
          <button
            type="button"
            onClick={() => setSearchVisible(!searchVisible)}
            className="p-2 hover:bg-neutral-ink-50 rounded-lg transition-colors flex-shrink-0"
          >
            <Search className="w-5 h-5 text-neutral-ink-600" />
          </button>
        </form>

        <Dropdown
          menu={{ items: notificationMenu }}
          placement="bottomRight"
          trigger={['click']}
          dropdownRender={(menu) => (
            <div className="w-96">
              <div className="px-4 py-3 border-b border-neutral-ink-100 flex items-center justify-between">
                <span className="font-semibold text-primary-900">消息通知</span>
                <span className="text-xs text-primary-500 cursor-pointer hover:underline">全部已读</span>
              </div>
              {menu}
              <div className="px-4 py-2 border-t border-neutral-ink-100 text-center">
                <span className="text-sm text-primary-500 cursor-pointer hover:underline">查看全部消息</span>
              </div>
            </div>
          )}
        >
          <button className="relative p-2 hover:bg-neutral-ink-50 rounded-lg transition-colors">
            <Badge count={unreadCount} size="small" offset={[-2, 2]}>
              <Bell className="w-5 h-5 text-neutral-ink-600" />
            </Badge>
          </button>
        </Dropdown>

        <button className="relative p-2 hover:bg-neutral-ink-50 rounded-lg transition-colors">
          <Badge count={5} size="small" offset={[-2, 2]}>
            <MessageSquare className="w-5 h-5 text-neutral-ink-600" />
          </Badge>
        </button>

        <div className="w-px h-6 bg-neutral-ink-200 mx-2" />

        <Dropdown menu={{ items: userMenu }} placement="bottomRight" trigger={['click']}>
          <div className="flex items-center gap-3 cursor-pointer hover:bg-neutral-ink-50 px-2 py-1.5 rounded-lg transition-colors">
            <Avatar src={user?.avatar} size={36} className="border-2 border-accent-gold/30" />
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-neutral-ink-900">{user?.name}</div>
              <div className="text-xs text-neutral-ink-500">{user?.firmInfo?.position}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-neutral-ink-400" />
          </div>
        </Dropdown>
      </div>
    </header>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default TopBar;
