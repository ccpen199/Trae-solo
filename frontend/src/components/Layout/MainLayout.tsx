import React, { useState, useEffect } from 'react';
import { Layout, Menu, theme, Badge, Avatar, Dropdown, Button, Space } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  HomeOutlined,
  CalendarOutlined,
  TeamOutlined,
  ShopOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { get, post } from '@/services/api';
import { Role } from '@hospital/shared';

const { Header, Sider, Content } = Layout;

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  roles?: Role[];
  path: string;
}

const allMenuItems: MenuItem[] = [
  {
    key: 'dashboard',
    label: '仪表盘',
    icon: <HomeOutlined />,
    roles: ['ADMIN', 'DOCTOR', 'NURSE', 'REGISTRAR', 'PATIENT'],
    path: 'dashboard',
  },
  {
    key: 'appointment',
    label: '预约管理',
    icon: <CalendarOutlined />,
    roles: ['ADMIN', 'REGISTRAR', 'PATIENT'],
    path: 'appointment',
  },
  {
    key: 'registration',
    label: '挂号管理',
    icon: <ShopOutlined />,
    roles: ['ADMIN', 'REGISTRAR'],
    path: 'registration',
  },
  {
    key: 'queue',
    label: '候诊队列',
    icon: <TeamOutlined />,
    roles: ['ADMIN', 'DOCTOR', 'NURSE', 'REGISTRAR'],
    path: 'queue',
  },
  {
    key: 'doctor',
    label: '医生管理',
    icon: <UserOutlined />,
    roles: ['ADMIN', 'REGISTRAR'],
    path: 'doctor',
  },
  {
    key: 'department',
    label: '科室管理',
    icon: <TeamOutlined />,
    roles: ['ADMIN'],
    path: 'department',
  },
  {
    key: 'schedule',
    label: '排班管理',
    icon: <CalendarOutlined />,
    roles: ['ADMIN', 'REGISTRAR'],
    path: 'schedule',
  },
  {
    key: 'slot',
    label: '号源管理',
    icon: <FileTextOutlined />,
    roles: ['ADMIN', 'REGISTRAR'],
    path: 'slot',
  },
  {
    key: 'statistics',
    label: '统计报表',
    icon: <BarChartOutlined />,
    roles: ['ADMIN', 'REGISTRAR', 'DOCTOR'],
    path: 'statistics',
  },
  {
    key: 'audit',
    label: '审计日志',
    icon: <FileTextOutlined />,
    roles: ['ADMIN'],
    path: 'audit',
  },
  {
    key: 'settings',
    label: '系统设置',
    icon: <SettingOutlined />,
    roles: ['ADMIN'],
    path: 'settings',
  },
];

export const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, getRoleName } = useAuth();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const result = await get<{ count: number }>('/notifications/unread-count');
      setUnreadCount(result.count);
    } catch (error) {
      console.error('获取未读通知数量失败:', error);
    }
  };

  const menuItems = allMenuItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const getSelectedKey = () => {
    const pathParts = location.pathname.split('/');
    const key = pathParts[pathParts.length - 1];
    return key || 'dashboard';
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    const menuItem = allMenuItems.find((item) => item.key === key);
    if (menuItem) {
      const basePath = location.pathname.split('/').slice(0, 2).join('/');
      navigate(`${basePath}/${menuItem.path}`);
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleMenuClickUser = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={220}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <span style={{ color: '#fff', fontSize: collapsed ? 12 : 18, fontWeight: 'bold' }}>
            {collapsed ? '医院' : '医院预约挂号系统'}
          </span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
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
          <Space size="middle">
            <Badge count={unreadCount} showZero>
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: 18 }} />}
              />
            </Badge>
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleMenuClickUser }}
              placement="bottomRight"
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 500 }}>{user?.name}</span>
                  <span style={{ fontSize: 12, color: '#666' }}>
                    {getRoleName(user?.role as Role)}
                  </span>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: 6,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
