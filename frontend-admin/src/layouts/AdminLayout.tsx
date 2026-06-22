import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Breadcrumb, theme } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  AuditOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuthStore } from '@/store/authStore';

const { Sider, Header, Content } = Layout;

const menuItems: MenuProps['items'] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '运营看板',
  },
  {
    key: '/riders',
    icon: <UserOutlined />,
    label: '骑手管理',
  },
  {
    key: '/orders',
    icon: <ShoppingCartOutlined />,
    label: '订单管理',
  },
  {
    key: '/audits',
    icon: <AuditOutlined />,
    label: '审核管理',
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: '系统设置',
  },
];

const breadcrumbNameMap: Record<string, string> = {
  '/dashboard': '运营看板',
  '/riders': '骑手管理',
  '/rider': '骑手详情',
  '/orders': '订单管理',
  '/order': '订单详情',
  '/audits': '审核管理',
  '/settings': '系统设置',
};

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { token: themeToken } = theme.useToken();

  const selectedKey = '/' + location.pathname.split('/').filter(Boolean)[0];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const pathSnippets = location.pathname.split('/').filter(Boolean);
  const breadcrumbItems = pathSnippets.map((_, index) => {
    const url = '/' + pathSnippets.slice(0, index + 1).join('/');
    const name = breadcrumbNameMap[url] || breadcrumbNameMap['/' + pathSnippets[index]] || '';
    return { title: name };
  });

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: themeToken.colorBgContainer,
        }}
      >
        <div className={collapsed ? 'logo logo-collapsed' : 'logo'}>
          {collapsed ? '管' : '运营管理后台'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: themeToken.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 1,
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              style: { fontSize: 18, cursor: 'pointer' },
              onClick: () => setCollapsed(!collapsed),
            })}
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="header-user-info" style={{ cursor: 'pointer' }}>
              <UserOutlined />
              <span>{user?.name || '管理员'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '16px 24px' }}>
          <Breadcrumb items={breadcrumbItems} style={{ marginBottom: 16 }} />
          <div
            style={{
              padding: 24,
              background: themeToken.colorBgContainer,
              borderRadius: 8,
              minHeight: 360,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
