import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  UserOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  ShopOutlined,
  CarOutlined,
  CarryOutOutlined,
  DashboardOutlined,
  FileTextOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const { Header, Content, Footer } = Layout;

function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState(location.pathname.split('/')[1] || 'home');

  const handleMenuClick = (e: { key: string }) => {
    setSelectedKey(e.key);
    if (e.key === 'home') {
      navigate('/');
    } else if (e.key === 'search-filter') {
      navigate('/labor');
    } else {
      navigate(`/${e.key}`);
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'my-orders',
      icon: <FileTextOutlined />,
      label: '我的订单',
      onClick: () => navigate('/my-orders'),
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: '消息通知',
      onClick: () => navigate('/notifications'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  const menuItems = [
    { key: 'home', icon: <HomeOutlined />, label: '首页' },
    { key: 'labor', icon: <ShopOutlined />, label: '用工服务' },
    { key: 'delivery', icon: <CarOutlined />, label: '找车服务' },
    { key: 'moving', icon: <CarryOutOutlined />, label: '搬家服务' },
    { key: 'search-filter', icon: <SearchOutlined />, label: '搜索筛选' },
    { key: 'admin', icon: <DashboardOutlined />, label: '管理后台' },
  ];

  if (user?.role === 'admin') {
    menuItems.splice(menuItems.length - 1, 1, {
      key: 'admin',
      icon: <DashboardOutlined />,
      label: '管理后台',
      children: [
        { key: 'admin', label: '数据概览' },
        { key: 'admin/capacity', label: '运力热力' },
        { key: 'admin/prices', label: '价格监控' },
        { key: 'admin/disputes', label: '纠纷仲裁' },
        { key: 'admin/quality-rules', label: '质检规则' },
        { key: 'admin/orders', label: '订单管理' },
        { key: 'admin/users', label: '用户管理' },
      ],
    });
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        background: '#fff',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div 
          style={{ 
            fontSize: 20, 
            fontWeight: 700, 
            color: '#1890ff',
            marginRight: 48,
            cursor: 'pointer',
          }}
          onClick={() => navigate('/')}
        >
          🚚 同城协同
        </div>
        
        <Menu
          mode="horizontal"
          selectedKeys={[selectedKey]}
          onClick={handleMenuClick}
          items={menuItems}
          style={{ flex: 1, borderBottom: 'none' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user ? (
            <>
              <Badge count={0} size="small">
                <Button 
                  type="text" 
                  icon={<BellOutlined />} 
                  onClick={() => navigate('/notifications')}
                />
              </Badge>
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar icon={<UserOutlined />} src={user.avatar} />
                  <span>{user.real_name || user.username}</span>
                </div>
              </Dropdown>
            </>
          ) : (
            <>
              <Button type="text" onClick={() => navigate('/login')}>登录</Button>
              <Button type="primary" onClick={() => navigate('/register')}>注册</Button>
            </>
          )}
        </div>
      </Header>

      <Content style={{ background: '#f5f5f5' }}>
        <Outlet />
      </Content>

      <Footer style={{ textAlign: 'center', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
        同城用工与物流协同平台 ©2024 - 让城市服务更高效
      </Footer>
    </Layout>
  );
}

export default MainLayout;
