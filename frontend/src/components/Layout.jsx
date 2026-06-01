import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Space, Badge } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
  AuditOutlined,
  BellOutlined,
  OrderedListOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: '1',
      label: `${user.name} (${user.role})`,
      icon: <UserOutlined />,
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: '2',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '控制台',
    },
    {
      key: '/applications',
      icon: <AppstoreOutlined />,
      label: '应用管理',
    },
    {
      key: '/rules',
      icon: <FileTextOutlined />,
      label: '脱敏规则',
    },
    {
      key: '/tasks',
      icon: <ThunderboltOutlined />,
      label: '执行任务',
    },
    {
      key: '/call-logs',
      icon: <HistoryOutlined />,
      label: '调用日志',
    },
    {
      key: '/change-orders',
      icon: <OrderedListOutlined />,
      label: '变更单',
    },
    {
      key: '/alerts',
      icon: <Badge count={0}><BellOutlined /></Badge>,
      label: '告警中心',
    },
    {
      key: '/audit-logs',
      icon: <AuditOutlined />,
      label: '审计日志',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div className="logo">日志脱敏</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user.name}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
