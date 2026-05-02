import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Badge } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ShoppingOutlined,
  OrderFormOutlined,
  WarningOutlined,
  TodoListOutlined,
  PlusOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
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

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '状态看板',
    },
    {
      key: '/accounts',
      icon: <ShoppingOutlined />,
      label: '账号列表',
    },
    {
      key: '/publish',
      icon: <PlusOutlined />,
      label: '发布账号',
    },
    {
      key: '/orders',
      icon: <OrderFormOutlined />,
      label: '订单管理',
    },
    {
      key: '/exceptions',
      icon: <Badge count={3} size="small">
        <WarningOutlined />
      </Badge>,
      label: '异常队列',
    },
    {
      key: '/todos',
      icon: <TodoListOutlined />,
      label: '待办入口',
    },
  ];

  const selectedKey = menuItems.find((item) => 
    location.pathname.startsWith(item.key)
  )?.key || '/dashboard';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark">
        <div className="logo">
          游戏账号交易平台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header className="site-layout-background" style={{ padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Text strong style={{ fontSize: 16 }}>
              {location.pathname === '/dashboard' && '状态看板'}
              {location.pathname === '/accounts' && '账号列表'}
              {location.pathname === '/publish' && '发布账号'}
              {location.pathname.startsWith('/accounts/') && '账号详情'}
              {location.pathname === '/orders' && '订单管理'}
              {location.pathname.startsWith('/orders/') && '订单详情'}
              {location.pathname === '/exceptions' && '异常队列'}
              {location.pathname.startsWith('/exceptions/') && '异常详情'}
              {location.pathname === '/todos' && '待办入口'}
            </Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Text type="secondary">余额: ¥{user?.balance?.toFixed(2) || '0.00'}</Text>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <Text>{user?.username}</Text>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: '24px', background: '#f0f2f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
