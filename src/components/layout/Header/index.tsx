import React from 'react';
import { Layout, Avatar, Dropdown, Badge, Button, Tooltip } from 'antd';
import {
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  ProfileOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/stores/useUserStore';

const { Header: AntHeader } = Layout;

export interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ collapsed, onToggle, className }) => {
  const { userInfo, clearUser } = useUserStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearUser();
    navigate('/login', { replace: true });
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <ProfileOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile'),
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

  return (
    <AntHeader
      className="flex items-center justify-between px-4 h-16 bg-white border-b border-neutral-100 shadow-sm z-10"
      style={{ padding: 0 }}
    >
      <div className="flex items-center">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
          className="!text-xl !text-neutral-600 !mr-4 hover:!bg-neutral-100"
        />
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-neutral-800 hidden sm:block">
            山东省文旅场所智慧监管服务平台
          </span>
          <span className="text-xs px-2 py-0.5 bg-blue-50 text-[#165DFF] rounded hidden md:block">
            v1.0.0
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Dropdown
          menu={{ items: [
            { key: '1', label: '您有3条告警待处理' },
            { key: '2', label: '新提交5家场所审核' },
            { key: '3', label: '今日检查任务已完成' },
          ]}}
          placement="bottomRight"
          trigger={['click']}
        >
          <Badge count={3} size="small" dot>
            <Button
              type="text"
              icon={<BellOutlined />}
              className="!text-neutral-600 hover:!bg-neutral-100"
            />
          </Badge>
        </Dropdown>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <div className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-neutral-100 transition-colors ml-2">
            <Avatar
              size="small"
              icon={<UserOutlined />}
              className="bg-[#165DFF]"
            />
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-neutral-800 leading-tight">
                {userInfo?.realName || '管理员'}
              </div>
              <div className="text-xs text-neutral-500 leading-tight">
                {userInfo?.role || '系统管理员'}
              </div>
            </div>
          </div>
        </Dropdown>
      </div>
    </AntHeader>
  );
};

export default Header;
