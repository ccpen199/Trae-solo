import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, theme } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  UnorderedListOutlined,
  HistoryOutlined,
  SettingOutlined,
  BarChartOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';

const { Header, Sider, Content } = Layout;

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user, logout } = useAuthStore();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleLogout = async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } finally {
      logout();
      navigate('/login');
    }
  };

  const userMenuItems = [
    {
      key: 'user',
      icon: <UserOutlined />,
      label: user?.name || '用户',
      disabled: true,
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
      key: '/',
      icon: <DashboardOutlined />,
      label: '调度工作台',
    },
    {
      key: '/orders',
      icon: <UnorderedListOutlined />,
      label: '订单管理',
    },
    {
      key: '/config',
      icon: <SettingOutlined />,
      label: '调度配置',
      hidden: user?.role !== 'admin',
    },
    {
      key: '/release',
      icon: <HistoryOutlined />,
      label: '待释放管理',
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: '报表统计',
    },
  ].filter((item) => !item.hidden);

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Layout className="layout-container">
      <Sider
        width={220}
        style={{ background: colorBgContainer }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 'bold',
            color: '#1890ff',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          订单调度系统
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="header-user-info">
              <Avatar icon={<UserOutlined />} />
              <span>{user?.name}</span>
              <span style={{ color: '#999', fontSize: '12px' }}>({user?.role === 'admin' ? '管理员' : '调度员'})</span>
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
