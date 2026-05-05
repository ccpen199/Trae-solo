import React from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Space } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HeartOutlined, UserOutlined, LogoutOutlined, ShopOutlined, HomeOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Header } = Layout;

const AppHeader = () => {
  const { user, logout, setShowLoginModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/favorites')) return 'favorites';
    if (path.startsWith('/products')) return 'products';
    if (path.startsWith('/companies')) return 'companies';
    return 'home';
  };

  const userMenuItems = [
    {
      key: 'favorites',
      icon: <HeartOutlined />,
      label: <Link to="/favorites">My Favorites</Link>,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: () => {
        logout();
        navigate('/');
      },
    },
  ];

  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: <Link to="/">Home</Link>,
    },
    {
      key: 'products',
      icon: <ShopOutlined />,
      label: <Link to="/products">Products</Link>,
    },
    {
      key: 'companies',
      icon: <ShopOutlined />,
      label: <Link to="/companies">Suppliers</Link>,
    },
    {
      key: 'favorites',
      icon: <HeartOutlined />,
      label: <Link to="/favorites">My Favorites</Link>,
    },
  ];

  return (
    <Header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <div
        style={{
          fontSize: '20px',
          fontWeight: 'bold',
          marginRight: '32px',
          color: '#1890ff',
        }}
      >
        <Link to="/" style={{ color: '#1890ff', textDecoration: 'none' }}>
          B2B Global Market
        </Link>
      </div>

      <Menu
        theme="light"
        mode="horizontal"
        selectedKeys={[getSelectedKey()]}
        items={menuItems}
        style={{ flex: 1, minWidth: 0, borderBottom: 'none' }}
      />

      <div>
        {user ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }}>
                {user.name?.charAt(0)?.toUpperCase()}
              </Avatar>
              <span>{user.name || user.email}</span>
            </Space>
          </Dropdown>
        ) : (
          <Button type="primary" onClick={() => setShowLoginModal(true)}>
            Login / Register
          </Button>
        )}
      </div>
    </Header>
  );
};

export default AppHeader;
