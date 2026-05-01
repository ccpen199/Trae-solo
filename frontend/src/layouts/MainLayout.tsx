import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, theme } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  PictureOutlined,
  AuditOutlined,
  SendOutlined,
  BarChartOutlined,
  FileSearchOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore, User } from '../stores/authStore';

const { Header, Sider, Content } = Layout;

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  roles?: string[];
}

const menuItems: MenuItem[] = [
  {
    key: 'dashboard',
    label: '数据看板',
    icon: <DashboardOutlined />,
    path: '/dashboard',
  },
  {
    key: 'content',
    label: '内容管理',
    icon: <FileTextOutlined />,
    path: '/content',
    roles: ['EDITOR', 'CHIEF_EDITOR', 'ADMIN'],
  },
  {
    key: 'media',
    label: '媒体库',
    icon: <PictureOutlined />,
    path: '/media',
    roles: ['EDITOR', 'CHIEF_EDITOR', 'ADMIN'],
  },
  {
    key: 'workflow',
    label: '审核中心',
    icon: <AuditOutlined />,
    path: '/workflow',
    roles: ['CHIEF_EDITOR', 'ADMIN'],
  },
  {
    key: 'distribution',
    label: '内容分发',
    icon: <SendOutlined />,
    path: '/distribution',
    roles: ['CHANNEL_OPERATOR', 'CHIEF_EDITOR', 'ADMIN'],
  },
  {
    key: 'analytics',
    label: '数据分析',
    icon: <BarChartOutlined />,
    path: '/analytics',
    roles: ['DATA_ANALYST', 'CHIEF_EDITOR', 'ADMIN'],
  },
  {
    key: 'audit',
    label: '审计日志',
    icon: <FileSearchOutlined />,
    path: '/audit',
    roles: ['CHIEF_EDITOR', 'ADMIN'],
  },
  {
    key: 'system',
    label: '系统管理',
    icon: <SettingOutlined />,
    path: '/system/users',
    roles: ['ADMIN'],
  },
];

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const filteredMenuItems = React.useMemo(() => {
    if (!user) return [];
    return menuItems.filter(
      (item) => !item.roles || item.roles.includes(user.role)
    );
  }, [user]);

  const selectedKey = React.useMemo(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    return pathParts[0] || 'dashboard';
  }, [location.pathname]);

  const handleMenuClick = ({ key }: { key: string }) => {
    const item = filteredMenuItems.find((i) => i.key === key);
    if (item) {
      navigate(item.path);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userDropdownItems = [
    {
      key: 'profile',
      label: '个人中心',
      icon: <UserOutlined />,
      onClick: () => navigate('/profile'),
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  const getRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      ADMIN: '系统管理员',
      CHIEF_EDITOR: '主编',
      EDITOR: '编辑',
      CHANNEL_OPERATOR: '渠道运营',
      DATA_ANALYST: '数据分析师',
    };
    return roleMap[role] || role;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
      >
        <div className="logo">
          <span className="logo-icon">📰</span>
          {!collapsed && <span>CMS管理系统</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={filteredMenuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ background: colorBgContainer, padding: '0 24px' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <div className="header-right">
            <Dropdown menu={{ items: userDropdownItems }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.displayName || user?.username}</span>
                <span style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: 12 }}>
                  ({getRoleName(user?.role || '')})
                </span>
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
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
