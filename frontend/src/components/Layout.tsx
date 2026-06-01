import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Badge } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  CameraOutlined,
  CalculatorOutlined,
  AuditOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { ROLE_MAP } from '../types';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '工作台',
    },
    {
      key: '/tasks',
      icon: <FileTextOutlined />,
      label: '查勘任务',
    },
    {
      key: '/photos',
      icon: <CameraOutlined />,
      label: '照片管理',
    },
    {
      key: '/loss',
      icon: <CalculatorOutlined />,
      label: '损失录入',
    },
    {
      key: '/review',
      icon: <AuditOutlined />,
      label: '定损审核',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
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

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    } else {
      navigate(key);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{ background: '#001529' }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 16px',
        }}>
          <Title
            level={4}
            style={{
              color: '#fff',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {collapsed ? '保险' : '保险查勘定损'}
          </Title>
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
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <div>
            <Badge status="processing" text={`当前角色: ${ROLE_MAP[user?.role || '']}`} />
          </div>

          <Dropdown
            menu={{ items: userMenuItems, onClick: handleMenuClick }}
            placement="bottomRight"
          >
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
              <Text strong>{user?.name}</Text>
            </div>
          </Dropdown>
        </Header>

        <Content style={{ margin: '24px', background: '#f0f2f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
