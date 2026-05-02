import React, { useState } from 'react';
import { Layout, Menu, Button, Badge, Dropdown, Avatar, theme } from 'antd';
import {
  DashboardOutlined,
  CarryOutOutlined,
  ContainerOutlined,
  AppstoreOutlined,
  LockOutlined,
  WarningOutlined,
  MessageOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRoleLabel } from '../utils/constants';

const { Header, Sider, Content } = Layout;

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, unreadCount, logout } = useAuth();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/vessel-plans',
      icon: <CarryOutOutlined />,
      label: '船舶计划',
    },
    {
      key: '/containers',
      icon: <ContainerOutlined />,
      label: '集装箱管理',
    },
    {
      key: '/tasks',
      icon: <AppstoreOutlined />,
      label: '作业任务',
    },
    {
      key: '/yard',
      icon: <AppstoreOutlined />,
      label: '堆场视图',
    },
    {
      key: '/gate-appointments',
      icon: <LockOutlined />,
      label: '闸口预约',
    },
    {
      key: '/exceptions',
      icon: <WarningOutlined />,
      label: '异常处理',
    },
    {
      key: '/messages',
      icon: (
        <Badge count={unreadCount} size="small">
          <MessageOutlined />
        </Badge>
      ),
      label: '消息中心',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user?.name,
      disabled: true,
    },
    {
      key: 'role',
      icon: <SettingOutlined />,
      label: `角色: ${getRoleLabel(user?.role)}`,
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="dark"
      >
        <div style={{ height: 64, margin: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CarryOutOutlined style={{ fontSize: 24, color: '#fff' }} />
          {!collapsed && (
            <span style={{ color: '#fff', marginLeft: 8, fontSize: 16, fontWeight: 'bold' }}>
              港口码头系统
            </span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 'bold' }}>
            港口码头作业系统
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={unreadCount} size="small">
              <Button
                type="text"
                icon={<MessageOutlined />}
                onClick={() => navigate('/messages')}
              />
            </Badge>
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
            >
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span style={{ marginLeft: 8 }}>{user?.name}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
