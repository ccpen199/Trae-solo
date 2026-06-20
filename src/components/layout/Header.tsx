import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  HelpCircle,
  X,
} from 'lucide-react';
import { Badge, Dropdown, Avatar, Input, List, Tooltip, message } from 'antd';
import { cn } from '@/utils/cn';
import { useUserStore } from '@/store/userStore';
import type { UserRole } from '@/types/entity';

interface HeaderProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'success';
}

interface UserMenuItem {
  type?: 'item';
  key: string;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}

interface UserMenuDivider {
  type: 'divider';
}

type UserMenuType = UserMenuItem | UserMenuDivider;

const roleNameMap: Record<UserRole, string> = {
  SUPER_ADMIN: '超级管理员',
  COMMUNITY_ADMIN: '小区管理员',
  PROPERTY_STAFF: '物业管家',
  FINANCE_STAFF: '财务人员',
  SECURITY_STAFF: '安保人员',
  RESIDENT: '业主',
};

function desensitizeName(name: string): string {
  if (!name) return '';
  if (name.length <= 1) return name;
  return name[0] + '*'.repeat(name.length - 1);
}

const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    title: '新工单提醒',
    description: '您有一个新的工单需要处理',
    time: '5分钟前',
    read: false,
    type: 'info',
  },
  {
    id: '2',
    title: '工单即将超时',
    description: '工单 WO-20240101 剩余30分钟',
    time: '1小时前',
    read: false,
    type: 'warning',
  },
  {
    id: '3',
    title: '缴费成功',
    description: '您的物业费已缴费成功',
    time: '2小时前',
    read: true,
    type: 'success',
  },
  {
    id: '4',
    title: '系统维护通知',
    description: '今晚23:00-次日01:00系统维护',
    time: '1天前',
    read: true,
    type: 'info',
  },
];

export function Header({ collapsed, onToggleCollapsed }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useUserStore();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  const displayName = user?.realName ? desensitizeName(user.realName) : '用户';
  const displayRole = user?.role ? roleNameMap[user.role] : '';

  const handleUserMenuClick = (key: string) => {
    switch (key) {
      case 'profile':
        navigate('/profile');
        break;
      case 'logout':
        logout();
        navigate('/login');
        break;
      default:
        break;
    }
  };

  const userMenuItems: UserMenuType[] = [
    {
      key: 'profile',
      icon: <User className="w-4 h-4" />,
      label: '个人中心',
    },
    {
      key: 'settings',
      icon: <Settings className="w-4 h-4" />,
      label: '账户设置',
    },
    {
      key: 'help',
      icon: <HelpCircle className="w-4 h-4" />,
      label: '帮助中心',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogOut className="w-4 h-4" />,
      label: '退出登录',
      danger: true,
    },
  ];

  const notificationDropdown = (
    <div className="w-80">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="font-medium text-white">通知消息</span>
        <span className="text-xs text-primary-400 cursor-pointer hover:text-primary-300">
          全部已读
        </span>
      </div>
      <div className="max-h-96 overflow-y-auto">
        <List
          dataSource={mockNotifications}
          renderItem={(item) => (
            <List.Item
              className={cn(
                'px-4 py-3 cursor-pointer transition-colors hover:bg-white/5 border-none',
                !item.read && 'bg-primary-500/5'
              )}
            >
              <div className="flex gap-3 w-full">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                    item.type === 'warning' && 'bg-warning-500',
                    item.type === 'success' && 'bg-success-500',
                    item.type === 'info' && 'bg-primary-500'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {item.title}
                    </span>
                    {!item.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5 line-clamp-2">
                    {item.description}
                  </p>
                  <span className="text-xs text-neutral-500 mt-1 block">
                    {item.time}
                  </span>
                </div>
              </div>
            </List.Item>
          )}
        />
      </div>
      <div className="px-4 py-3 border-t border-white/10 text-center">
        <span
          className="text-sm text-primary-400 cursor-pointer hover:text-primary-300"
          onClick={() => message.info('查看全部通知')}
        >
          查看全部通知
        </span>
      </div>
    </div>
  );

  const userDropdown = (
    <div className="w-56 py-2">
      {userMenuItems.map((item) => {
        if (item.type === 'divider') {
          return <div key="divider" className="my-2 h-px bg-white/10" />;
        }
        return (
          <div
            key={item.key}
            onClick={() => handleUserMenuClick(item.key)}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-white/5',
              item.danger && 'text-danger-400 hover:text-danger-300 hover:bg-danger-500/5',
              !item.danger && 'text-neutral-200'
            )}
          >
            {item.icon}
            <span className="text-sm">{item.label}</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <header
      className={cn(
        'h-16 flex items-center gap-4 px-4 lg:px-6 border-b border-white/10',
        'bg-neutral-950/60 backdrop-blur-xl sticky top-0 z-30'
      )}
    >
      <button
        onClick={onToggleCollapsed}
        className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div
        ref={searchContainerRef}
        className={cn(
          'relative flex-1 max-w-xl transition-all duration-300',
          searchFocused && 'max-w-2xl'
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200',
            searchFocused
              ? 'bg-white/8 border-primary-500/40 shadow-glow'
              : 'bg-white/5 border-white/10'
          )}
        >
          <Search className="w-4 h-4 text-neutral-400" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            placeholder="全局搜索：工单、住户、活动..."
            className="bg-transparent border-none text-white placeholder-neutral-500 focus:ring-0 p-0 h-auto flex-1"
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue('')}
              className="text-neutral-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden lg:inline-block text-xs text-neutral-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
            Ctrl+K
          </kbd>
        </div>

        {searchFocused && (
          <div className="absolute top-full mt-2 left-0 right-0 glass-card p-2 z-50">
            <div className="px-3 py-2 text-xs text-neutral-500">搜索建议</div>
            <div className="px-3 py-2 text-sm text-neutral-300 hover:bg-white/5 rounded-lg cursor-pointer">
              搜索工单：WO-20240101
            </div>
            <div className="px-3 py-2 text-sm text-neutral-300 hover:bg-white/5 rounded-lg cursor-pointer">
              搜索住户：张三
            </div>
            <div className="px-3 py-2 text-sm text-neutral-300 hover:bg-white/5 rounded-lg cursor-pointer">
              搜索活动：春节联欢
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <Tooltip title="帮助中心">
          <button className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
        </Tooltip>

        <Dropdown
          overlayClassName="!bg-neutral-900 !border !border-white/10 !rounded-xl !p-0 !shadow-2xl"
          placement="bottomRight"
          dropdownRender={() => notificationDropdown}
          trigger={['click']}
        >
          <button className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors relative">
            <Badge count={unreadCount} size="small" offset={[-2, 2]}>
              <Bell className="w-5 h-5" />
            </Badge>
          </button>
        </Dropdown>

        <div className="w-px h-6 bg-white/10 mx-2" />

        <Dropdown
          overlayClassName="!bg-neutral-900 !border !border-white/10 !rounded-xl !p-0 !shadow-2xl"
          placement="bottomRight"
          dropdownRender={() => userDropdown}
          trigger={['click']}
        >
          <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <Avatar
              size={32}
              className="bg-gradient-to-br from-primary-400 to-primary-600 border-none"
              icon={<User className="w-4 h-4" />}
              src={user?.avatar}
            />
            <div className="hidden lg:flex flex-col items-start">
              <span className="text-sm font-medium text-white leading-tight">
                {displayName}
              </span>
              <span className="text-xs text-neutral-500 leading-tight">
                {displayRole}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-neutral-500 hidden lg:block" />
          </button>
        </Dropdown>
      </div>
    </header>
  );
}
