import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Input } from 'antd';
import {
  DashboardOutlined,
  UnorderedListOutlined,
  CloudUploadOutlined,
  FolderOutlined,
  AlertOutlined,
  WalletOutlined,
  SettingOutlined,
  BellOutlined,
  MessageOutlined,
  SearchOutlined,
  LogoutOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { message } from 'antd';

const { Header, Sider, Content } = Layout;

const ProviderLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo, logout } = useUserStore();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: '/provider/dashboard',
      icon: <DashboardOutlined />,
      label: '工作台',
      onClick: () => navigate('/provider/dashboard')
    },
    {
      key: '/provider/tasks',
      icon: <UnorderedListOutlined />,
      label: '任务管理',
      onClick: () => navigate('/provider/tasks')
    },
    {
      key: '/provider/submissions',
      icon: <CloudUploadOutlined />,
      label: '稿件提交',
      onClick: () => navigate('/provider/submissions')
    },
    {
      key: '/provider/portfolio',
      icon: <FolderOutlined />,
      label: '作品集',
      onClick: () => navigate('/provider/portfolio')
    },
    {
      key: '/provider/disputes',
      icon: <AlertOutlined />,
      label: '争议中心',
      onClick: () => navigate('/provider/disputes')
    },
    {
      key: '/provider/finance',
      icon: <WalletOutlined />,
      label: '财务中心',
      onClick: () => navigate('/provider/finance')
    },
    {
      key: '/provider/settings',
      icon: <SettingOutlined />,
      label: '账户设置',
      onClick: () => navigate('/provider/settings')
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      message.success('退出登录成功');
      navigate('/login');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const userMenu = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/provider/settings')
    },
    {
      type: 'divider' as const
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  const selectedKey = location.pathname;

  return (
    <Layout className="min-h-screen">
      <Sider
        width={220}
        collapsed={collapsed}
        onCollapse={setCollapsed}
        className="bg-white"
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-100">
          <h1 className={`font-bold text-primary-800 ${collapsed ? 'text-xl' : 'text-xl'}`}>
            {collapsed ? 'CS' : '创意众包'}
          </h1>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          className="h-full border-none"
        />
      </Sider>
      <Layout>
        <Header className="bg-white px-6 flex items-center justify-between border-b border-gray-100 h-16">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <Input
              placeholder="搜索任务、需求..."
              prefix={<SearchOutlined className="text-gray-400" />}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-4">
            <Badge count={3}>
              <MessageOutlined className="text-xl text-gray-600 cursor-pointer hover:text-primary-700 transition-colors" />
            </Badge>
            <Badge count={5}>
              <BellOutlined className="text-xl text-gray-600 cursor-pointer hover:text-primary-700 transition-colors" />
            </Badge>
            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors">
                <Avatar size={32} src={userInfo?.avatar} icon={<UserOutlined />}>
                  {userInfo?.name?.charAt(0)}
                </Avatar>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-gray-800">{userInfo?.name}</div>
                  <div className="text-xs text-gray-500">服务商</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="p-6 overflow-auto">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default ProviderLayout;
