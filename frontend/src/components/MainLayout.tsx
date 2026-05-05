import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, theme } from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useUserStore, MenuItem as MenuItemType } from '@/store/userStore';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { message } from '@/utils/message';

const { Header, Sider, Content } = Layout;

const iconMap: Record<string, React.ReactNode> = {
  setting: <SettingOutlined />,
  apartment: <UserOutlined />,
  shop: <UserOutlined />,
  team: <UserOutlined />,
  'safety-certificate': <UserOutlined />,
  appstore: <UserOutlined />,
  'deployment-unit': <UserOutlined />,
  inbox: <UserOutlined />,
  'plus-circle': <UserOutlined />,
  message: <UserOutlined />,
  'file-search': <UserOutlined />,
};

const getIcon = (iconName?: string) => {
  return iconName ? iconMap[iconName] || <UserOutlined /> : <UserOutlined />;
};

const buildMenuItems = (menus: MenuItemType[]): any[] => {
  return menus.map((menu) => ({
    key: menu.path || menu.id,
    icon: getIcon(menu.icon),
    label: menu.name,
    children: menu.children ? buildMenuItems(menu.children) : undefined,
  }));
};

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, menus, clearUserInfo } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const handleLogout = () => {
    clearUserInfo();
    message.success('已退出登录');
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人设置',
      onClick: () => {},
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const menuItems = buildMenuItems(menus).length > 0
    ? buildMenuItems(menus)
    : [
        {
          key: '/dashboard',
          icon: <UserOutlined />,
          label: '首页',
        },
        {
          key: 'system',
          icon: <SettingOutlined />,
          label: '系统管理',
          children: [
            { key: '/system/organization', label: '组织管理' },
            { key: '/system/store', label: '门店管理' },
            { key: '/system/user', label: '人员管理' },
            { key: '/system/role', label: '角色管理' },
            { key: '/system/module', label: '模块管理' },
          ],
        },
      ];

  const handleMenuClick = (e: { key: string }) => {
    if (e.key.startsWith('/')) {
      navigate(e.key);
    }
  };

  const getSelectedKeys = () => {
    return [location.pathname];
  };

  const getOpenKeys = () => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts.length > 1) {
      return [pathParts[0]];
    }
    return [];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ color: '#fff', margin: 0, fontSize: collapsed ? 16 : 20 }}>
            {collapsed ? '管理' : '系统管理平台'}
          </h1>
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
        <Header style={{ padding: '0 16px', background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: 'rgba(0, 0, 0, 0.85)' }}>
              欢迎，{user?.name || '用户'}
            </span>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar style={{ cursor: 'pointer' }} icon={<UserOutlined />} />
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: '24px 16px', background: '#f0f2f5', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
