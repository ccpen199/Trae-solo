import { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Badge, Input, Space, Button } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Home,
  Camera,
  Bell,
  Settings,
  Users,
  HardDrive,
  Search,
  ChevronDown,
  Shield,
  LogOut,
  User,
} from 'lucide-react';
import { useAlertStore } from '@/stores/useAlertStore';

const { Header, Sider, Content } = AntLayout;
const { Search: SearchInput } = Input;

const menuItems = [
  {
    key: '/',
    icon: <Camera size={18} />,
    label: '设备列表',
  },
  {
    key: '/alerts',
    icon: <Bell size={18} />,
    label: '告警中心',
  },
  {
    key: '/scenes',
    icon: <Settings size={18} />,
    label: '场景联动',
  },
  {
    key: '/family',
    icon: <Users size={18} />,
    label: '家庭管理',
  },
  {
    key: '/storage',
    icon: <HardDrive size={18} />,
    label: '存储服务',
  },
];

const userMenuItems = [
  {
    key: 'profile',
    icon: <User size={16} />,
    label: '个人资料',
  },
  {
    key: 'settings',
    icon: <Settings size={16} />,
    label: '设置',
  },
  {
    type: 'divider' as const,
  },
  {
    key: 'logout',
    icon: <LogOut size={16} />,
    label: '退出登录',
    danger: true,
  },
];

const familyMenuItems = [
  {
    key: 'family1',
    label: '我的家',
  },
  {
    key: 'family2',
    label: '父母家',
  },
  {
    key: 'add',
    label: '+ 添加家庭',
  },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount, fetchUnreadCount } = useAlertStore();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  const selectedKey = location.pathname.startsWith('/device') ? '/' : location.pathname;

  return (
    <AntLayout className="min-h-screen bg-gray-50">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        className="bg-white border-r border-gray-100"
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg text-gray-800">安防云</span>
            )}
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          className="border-r-0 pt-4"
          style={{ height: 'calc(100vh - 64px)' }}
        />
      </Sider>
      <AntLayout>
        <Header className="bg-white border-b border-gray-100 px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Dropdown menu={{ items: familyMenuItems }} trigger={['click']}>
              <Button type="text" className="flex items-center gap-2 h-8 px-2">
                <Home size={18} className="text-primary-500" />
                <span className="font-medium text-gray-800">我的家</span>
                <ChevronDown size={14} className="text-gray-400" />
              </Button>
            </Dropdown>
          </div>
          <div className="flex-1 max-w-md mx-8">
            <SearchInput
              placeholder="搜索设备、告警..."
              allowClear
              enterButton
              size="middle"
              prefix={<Search size={16} className="text-gray-400" />}
            />
          </div>
          <Space size={16}>
            <Badge count={unreadCount} size="small" offset={[-2, 2]}>
              <Button
                type="text"
                shape="circle"
                icon={<Bell size={20} className="text-gray-600" />}
                onClick={() => navigate('/alerts')}
                className="hover:bg-gray-100"
              />
            </Badge>
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} trigger={['click']}>
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors">
                <Avatar size={32} className="bg-primary-500">
                  <User size={18} />
                </Avatar>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-gray-800">管理员</div>
                  <div className="text-xs text-gray-500">admin@home.com</div>
                </div>
                <ChevronDown size={14} className="text-gray-400 hidden md:block" />
              </div>
            </Dropdown>
          </Space>
        </Header>
        <Content className="p-6 overflow-auto">
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
