import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  HomeOutlined,
  QrcodeOutlined,
  ForkOutlined,
  CreditCardOutlined,
  ShoppingOutlined,
  GiftOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons';

const { Header, Content } = Layout;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState(location.pathname.split('/')[1] || 'home');

  const userStr = localStorage.getItem('tft_user');
  const user = userStr ? JSON.parse(userStr) : null;

  const menuItems = [
    { key: 'home', icon: <HomeOutlined />, label: '首页' },
    { key: 'qrcode', icon: <QrcodeOutlined />, label: '乘车码' },
    { key: 'route-planning', icon: <ForkOutlined />, label: '线路规划' },
    { key: 'my-cards', icon: <CreditCardOutlined />, label: '我的卡片' },
    { key: 'life-service', icon: <ShoppingOutlined />, label: '生活服务' },
    { key: 'points-mall', icon: <GiftOutlined />, label: '积分商城' },
    { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
  ];

  const handleMenuClick = ({ key }) => {
    setSelectedKey(key);
    navigate(`/${key}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('tft_token');
    localStorage.removeItem('tft_user');
    navigate('/login');
  };

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: '个人中心', onClick: () => navigate('/profile') },
      { key: 'admin', icon: <SettingOutlined />, label: '管理后台', onClick: () => navigate('/admin/dashboard') },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
    ]
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#1890ff' }}>
              🚌 天府通
            </div>
            <Menu
              mode="horizontal"
              selectedKeys={[selectedKey]}
              items={menuItems}
              onClick={handleMenuClick}
              style={{ minWidth: 600, borderBottom: 'none' }}
            />
          </div>
          <div>
            {user ? (
              <Dropdown menu={userMenu} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar style={{ background: '#1890ff' }} icon={<UserOutlined />} />
                  <span>{user.real_name || user.phone}</span>
                </Space>
              </Dropdown>
            ) : (
              <Space>
                <a onClick={() => navigate('/login')}>登录</a>
                <a onClick={() => navigate('/register')}>注册</a>
              </Space>
            )}
          </div>
        </div>
      </Header>
      <Content style={{ padding: '24px 0' }}>
        <Outlet />
      </Content>
    </Layout>
  );
};

export default MainLayout;
