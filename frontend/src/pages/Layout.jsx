import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Dropdown, Avatar, Badge, theme, Button, Space, Typography } from 'antd';
import {
  GlobalOutlined,
  OrderedListOutlined,
  BarChartOutlined,
  MessageOutlined,
  LogoutOutlined,
  UserOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { messageApi } from '../services/api';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await messageApi.getUnreadCount();
        if (response.data.success) {
          setUnreadCount(response.data.data.unreadCount);
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    {
      key: '/',
      icon: <OrderedListOutlined />,
      label: '订单列表',
      onClick: () => navigate('/'),
    },
    {
      key: '/create',
      icon: <PlusOutlined />,
      label: '创建订单',
      onClick: () => navigate('/create'),
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: '报表统计',
      onClick: () => navigate('/reports'),
    },
    {
      key: '/messages',
      icon: <Badge count={unreadCount} size="small"><MessageOutlined /></Badge>,
      label: '消息中心',
      onClick: () => navigate('/messages'),
    },
  ];

  const userMenu = {
    items: [
      {
        key: '1',
        label: (
          <div>
            <Text strong>{user?.name}</Text>
            <br />
            <Text type="secondary" code>{user?.roleName}</Text>
          </div>
        ),
      },
      {
        type: 'divider',
      },
      {
        key: '2',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: () => {
          logout();
          navigate('/login');
        },
      },
    ],
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <div style={{
          height: 64,
          margin: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <GlobalOutlined style={{ fontSize: 24, color: '#fff' }} />
          {!collapsed && (
            <span style={{ color: '#fff', marginLeft: 8, fontSize: 18, fontWeight: 'bold' }}>
              地图导航系统
            </span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>
      <AntLayout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div />
          <Space>
            <Dropdown menu={userMenu}>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{user?.name}</span>
            </div>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: '16px', padding: 24, background: colorBgContainer }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
