import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Button, Dropdown, Avatar, Typography, theme } from 'antd';
import {
  BookOutlined,
  TeamOutlined,
  SearchOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FileTextOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = AntLayout;
const { Title } = Typography;

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const getMenuItems = () => {
    const items = [
      {
        key: '/books',
        icon: <SearchOutlined />,
        label: '图书检索',
        onClick: () => navigate('/books'),
      },
    ];

    if (isAdmin()) {
      items.push(
        {
          key: '/admin/books',
          icon: <BookOutlined />,
          label: '图书管理',
          onClick: () => navigate('/admin/books'),
        },
        {
          key: '/admin/readers',
          icon: <TeamOutlined />,
          label: '读者管理',
          onClick: () => navigate('/admin/readers'),
        },
        {
          key: '/admin/borrows',
          icon: <ShoppingCartOutlined />,
          label: '借阅管理',
          onClick: () => navigate('/admin/borrows'),
        },
        {
          key: '/admin/admins',
          icon: <SettingOutlined />,
          label: '管理员管理',
          onClick: () => navigate('/admin/admins'),
        }
      );
    }

    if (user?.role === 'reader') {
      items.push({
        key: '/reader/records',
        icon: <FileTextOutlined />,
        label: '我的借阅',
        onClick: () => navigate('/reader/records'),
      });
    }

    return items;
  };

  const userMenuItems = [
    {
      key: 'user-info',
      icon: <UserOutlined />,
      label: (
        <div>
          <div style={{ fontWeight: 'bold' }}>{user?.name || user?.username}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {user?.role === 'admin' ? '管理员' : '读者'}
          </div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} className="no-print">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.1)' }}>
          {collapsed ? (
            <BookOutlined style={{ color: 'white', fontSize: 24 }} />
          ) : (
            <Title level={4} style={{ color: 'white', margin: 0 }}>
              图书管理系统
            </Title>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
        />
      </Sider>
      <AntLayout>
        <Header
          className="no-print"
          style={{
            padding: '0 16px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.name || user?.username}</span>
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: 8,
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
