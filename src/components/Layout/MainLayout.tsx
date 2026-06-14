import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Space } from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  PayCircleOutlined,
  TeamOutlined,
  GiftOutlined,
  CalculatorOutlined,
  WarningOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import useUserStore from '@/store/userStore';
import type { MenuProps } from 'antd';
import type { UserRole, MenuItem } from '@/types';

const { Header, Sider, Content } = Layout;

const menuItems: MenuItem[] = [
  {
    key: 'home',
    label: '首页',
    icon: 'HomeOutlined',
    path: '/',
    roles: ['resident', 'flexible', 'admin_tax', 'admin_ops'],
  },
  {
    key: 'insurance',
    label: '参保查询',
    icon: 'FileTextOutlined',
    path: '/insurance',
    roles: ['resident', 'flexible', 'admin_tax', 'admin_ops'],
  },
  {
    key: 'payment',
    label: '缴费中心',
    icon: 'PayCircleOutlined',
    path: '/payment',
    roles: ['resident', 'flexible', 'admin_tax', 'admin_ops'],
  },
  {
    key: 'family',
    label: '家庭账户',
    icon: 'TeamOutlined',
    path: '/family',
    roles: ['resident', 'flexible'],
  },
  {
    key: 'benefit',
    label: '待遇查询',
    icon: 'GiftOutlined',
    path: '/benefit',
    roles: ['resident', 'flexible'],
  },
  {
    key: 'calculator',
    label: '待遇测算',
    icon: 'CalculatorOutlined',
    path: '/calculator',
    roles: ['resident', 'flexible'],
  },
  {
    key: 'admin-warnings',
    label: '异常预警',
    icon: 'WarningOutlined',
    path: '/admin/warnings',
    roles: ['admin_tax', 'admin_ops'],
  },
  {
    key: 'admin-audit',
    label: '稽核规则',
    icon: 'SettingOutlined',
    path: '/admin/audit',
    roles: ['admin_tax', 'admin_ops'],
  },
  {
    key: 'admin-datashare',
    label: '数据共享',
    icon: 'FileTextOutlined',
    path: '/admin/datashare',
    roles: ['admin_tax', 'admin_ops'],
  },
];

const iconMap: Record<string, React.ReactNode> = {
  HomeOutlined: <HomeOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  PayCircleOutlined: <PayCircleOutlined />,
  TeamOutlined: <TeamOutlined />,
  GiftOutlined: <GiftOutlined />,
  CalculatorOutlined: <CalculatorOutlined />,
  WarningOutlined: <WarningOutlined />,
  SettingOutlined: <SettingOutlined />,
};

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUserStore();

  const filteredMenuItems = menuItems.filter(
    (item) => user && item.roles.includes(user.userType as UserRole)
  );

  const antdMenuItems: MenuProps['items'] = filteredMenuItems.map((item) => ({
    key: item.path,
    label: item.label,
    icon: item.icon ? iconMap[item.icon] : null,
  }));

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: '个人中心',
      icon: <UserOutlined />,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        style={{
          background: 'linear-gradient(180deg, #165DFF 0%, #0E42B3 100%)',
        }}
      >
        <div className="flex items-center justify-center h-16 text-white text-xl font-bold">
          {collapsed ? '社保' : '社保服务平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={antdMenuItems}
          onClick={handleMenuClick}
          style={{
            background: 'transparent',
            borderRight: 'none',
          }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <Space size={16}>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space className="cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                <Avatar
                  style={{ backgroundColor: '#165DFF' }}
                  icon={<UserOutlined />}
                />
                <span className="text-gray-700">{user?.name || '用户'}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: '#f5f7fa',
            borderRadius: '8px',
            minHeight: 'calc(100vh - 112px)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
