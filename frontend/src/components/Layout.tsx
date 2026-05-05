import React from 'react';
import { Layout, Menu, Dropdown, Avatar, Typography, Button } from 'antd';
import {
  TeamOutlined,
  FileOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Role } from '@/types';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  roles: Role[];
}

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();

  const menuItems: MenuItem[] = [
    {
      key: '/dashboard/users',
      label: '用户管理',
      icon: <TeamOutlined />,
      roles: [Role.ADMIN],
    },
    {
      key: '/dashboard/tasks',
      label: '任务管理',
      icon: <FileOutlined />,
      roles: [Role.ADMIN, Role.SUPERVISOR, Role.EMPLOYEE],
    },
  ];

  // 根据角色过滤菜单
  const filteredMenuItems = menuItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  // 确定当前选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    const found = filteredMenuItems.find((item) => path.startsWith(item.key));
    return found ? [found.key] : [];
  };

  const handleMenuClick = (e: { key: string }) => {
    navigate(e.key);
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'user',
      label: (
        <div style={{ padding: '8px 0' }}>
          <Text strong>{user?.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {user?.role === Role.ADMIN
              ? '管理员'
              : user?.role === Role.SUPERVISOR
              ? '主管'
              : '员工'}
          </Text>
        </div>
      ),
      icon: <UserOutlined />,
      disabled: true,
    },
    { type: 'divider' as const },
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
        theme="light"
        width={220}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          borderRight: '1px solid #f0f0f0',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
            marginBottom: 16,
          }}
        >
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            任务管理系统
          </Title>
        </div>

        <Menu
          mode="inline"
          selectedKeys={getSelectedKey()}
          items={filteredMenuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 'none' }}
        />
      </Sider>

      <Layout style={{ marginLeft: 220 }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 4,
              }}
            >
              <Avatar
                icon={<UserOutlined />}
                style={{ backgroundColor: '#1890ff', marginRight: 8 }}
              >
                {user?.name?.charAt(0)}
              </Avatar>
              <Text>{user?.name}</Text>
            </div>
          </Dropdown>
        </Header>

        <Content
          style={{
            margin: 24,
            padding: 24,
            background: '#fff',
            borderRadius: 8,
            minHeight: 'calc(100vh - 112px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
