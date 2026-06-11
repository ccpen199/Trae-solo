import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MoonOutlined,
  SunOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { Avatar, Dropdown, Badge, Button, Popover, List, Typography, Space } from 'antd';
import { useUserStore, selectUser, selectUserRole } from '../../store/user';
import {
  useAppStore,
  selectUnreadCount,
  selectNotifications,
  selectSidebarCollapsed,
  selectTheme,
} from '../../store/app';
import type { UserRole } from '../../../shared/types';
import { maskPhone } from '../../utils/format';

const { Text, Paragraph } = Typography;

const roleLabels: Record<UserRole, string> = {
  owner: '货主',
  fleet: '车队',
  driver: '司机',
  operator: '运营',
  admin: '管理员',
};

const Header: React.FC = () => {
  const navigate = useNavigate();
  const user = useUserStore(selectUser);
  const userRole = useUserStore(selectUserRole);
  const logout = useUserStore((state) => state.logout);
  const collapsed = useAppStore(selectSidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const theme = useAppStore(selectTheme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const unreadCount = useAppStore(selectUnreadCount);
  const notifications = useAppStore(selectNotifications);
  const markAsRead = useAppStore((state) => state.markAsRead);
  const markAllAsRead = useAppStore((state) => state.markAllAsRead);

  const [notificationOpen, setNotificationOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '账号设置',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const notificationContent = (
    <div className="w-80">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
        <Text strong>通知消息</Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={markAllAsRead}>
            全部已读
          </Button>
        )}
      </div>
      <List
        dataSource={notifications.slice(0, 5)}
        locale={{ emptyText: '暂无通知' }}
        renderItem={(item) => (
          <List.Item
            className="cursor-pointer hover:bg-gray-50 px-4"
            onClick={() => {
              if (!item.read) {
                markAsRead(item.id);
              }
            }}
          >
            <List.Item.Meta
              title={
                <Space>
                  <Text strong className={item.read ? 'text-gray-400' : ''}>
                    {item.title}
                  </Text>
                  {!item.read && (
                    <Badge status="processing" size="small" />
                  )}
                </Space>
              }
              description={
                <div>
                  <Paragraph ellipsis={{ rows: 1 }} className="mb-1">
                    {item.message}
                  </Paragraph>
                  <Text type="secondary" className="text-xs">
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </div>
              }
            />
          </List.Item>
        )}
      />
      {notifications.length > 0 && (
        <div className="border-t border-gray-200 px-4 py-2 text-center">
          <Button type="link" size="small" onClick={() => navigate('/notifications')}>
            查看全部
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleSidebar}
          className="text-gray-600 dark:text-gray-300 hover:text-primary-500"
        />
        <div className="hidden sm:block">
          <Text className="text-gray-500 dark:text-gray-400 text-sm">
            {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </Text>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="text"
          icon={theme === 'dark' ? <SunOutlined /> : theme === 'light' ? <MoonOutlined /> : <GlobalOutlined />}
          onClick={toggleTheme}
          className="text-gray-600 dark:text-gray-300 hover:text-primary-500"
        />

        <Popover
          content={notificationContent}
          trigger="click"
          open={notificationOpen}
          onOpenChange={setNotificationOpen}
          placement="bottomRight"
          overlayClassName="notification-popover"
        >
          <Badge count={unreadCount} size="small">
            <Button
              type="text"
              icon={<BellOutlined />}
              className="text-gray-600 dark:text-gray-300 hover:text-primary-500"
            />
          </Badge>
        </Popover>

        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors">
            <Avatar
              size={36}
              src={user?.avatar}
              icon={!user?.avatar && <UserOutlined />}
              className="bg-primary-500"
            />
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.username || '用户'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {userRole ? roleLabels[userRole] : ''}
                {user?.phone && ` · ${maskPhone(user.phone)}`}
              </div>
            </div>
          </div>
        </Dropdown>
      </div>
    </header>
  );
};

export default Header;
