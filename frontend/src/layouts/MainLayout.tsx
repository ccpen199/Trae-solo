import React, { useState } from 'react';
import { Layout, Menu, Dropdown, Avatar, Button, theme } from 'antd';
import {
  DashboardOutlined,
  HomeOutlined,
  ShopOutlined,
  AppstoreOutlined,
  TeamOutlined,
  FileTextOutlined,
  SwapOutlined,
  ToolOutlined,
  BarChartOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const getRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: '系统管理员',
      dormitory_admin: '宿舍管理员',
      student: '学生',
    };
    return roleMap[role] || role;
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '系统概览',
    },
    {
      key: 'dormitory',
      icon: <HomeOutlined />,
      label: '宿舍管理',
      children: [
        { key: '/dormitories', icon: <ShopOutlined />, label: '宿舍楼管理' },
        { key: '/rooms', icon: <HomeOutlined />, label: '房间管理' },
        { key: '/beds', icon: <AppstoreOutlined />, label: '床位管理' },
      ],
    },
    {
      key: 'checkin',
      icon: <TeamOutlined />,
      label: '入住管理',
      children: [
        { key: '/students', icon: <TeamOutlined />, label: '学生信息' },
        { key: '/check-ins', icon: <FileTextOutlined />, label: '入住记录' },
        { key: '/room-changes', icon: <SwapOutlined />, label: '调房管理' },
      ],
    },
    {
      key: '/maintenance',
      icon: <ToolOutlined />,
      label: '维修管理',
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: '统计报表',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'user-info',
      icon: <UserOutlined />,
      label: `${user?.name} (${getRoleName(user?.role || '')})`,
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

  const getSelectedKeys = () => {
    return [location.pathname];
  };

  const getOpenKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/dormitories') || path.startsWith('/rooms') || path.startsWith('/beds')) {
      return ['dormitory'];
    }
    if (path.startsWith('/students') || path.startsWith('/check-ins') || path.startsWith('/room-changes')) {
      return ['checkin'];
    }
    return [];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div style={{ height: 64, padding: '16px', textAlign: 'center' }}>
          {collapsed ? (
            <span style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>宿</span>
          ) : (
            <span style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>学生宿舍管理系统</span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
                <span>{user?.name}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: 8,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;