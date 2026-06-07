import React from 'react';
import { Layout as AntLayout, Menu, Button, Dropdown, Avatar, Badge } from 'antd';
import {
  HomeOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  DashboardOutlined,
  LogoutOutlined,
  SettingOutlined,
  FileTextOutlined,
  AuditOutlined,
  MoneyCollectOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Header, Content, Sider } = AntLayout;

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const enterDemoAdmin = () => {
    localStorage.setItem('token', 'local-demo-admin-token');
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      phone: '13800000000',
      name: '演示管理员',
      role: 'admin',
      isVerified: true,
      rating: 5,
      orderCount: 128,
      faceVerified: true,
      address: '本地复验账号',
    }));
    navigate('/admin');
    window.location.reload();
  };

  const customerMenuItems = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/services', icon: <ShoppingOutlined />, label: '服务商城' },
    { key: '/orders', icon: <FileTextOutlined />, label: '我的订单' },
    { key: '/profile', icon: <UserOutlined />, label: '个人中心' },
  ];

  const providerMenuItems = [
    { key: '/', icon: <HomeOutlined />, label: '工作台' },
    { key: '/provider/orders', icon: <FileTextOutlined />, label: '服务订单' },
    { key: '/profile', icon: <UserOutlined />, label: '个人中心' },
  ];

  const adminMenuItems = [
    { key: '/admin', icon: <DashboardOutlined />, label: '数据概览' },
    { key: '/admin/orders', icon: <FileTextOutlined />, label: '订单管理' },
    { key: '/admin/providers', icon: <AuditOutlined />, label: '服务商审核' },
    { key: '/admin/inspection', icon: <SettingOutlined />, label: '质检规则' },
    { key: '/admin/settlements', icon: <MoneyCollectOutlined />, label: '结算管理' },
  ];

  const getMenuItems = () => {
    if (user?.role === 'admin') return adminMenuItems;
    if (user?.role === 'provider') return providerMenuItems;
    return customerMenuItems;
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    } else if (key === 'profile') {
      navigate('/profile');
    }
  };

  const selectedKey = getMenuItems().find(item => location.pathname.startsWith(item.key))?.key || '/';

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: '#fff',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ShoppingCartOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          <span style={{ fontSize: '20px', fontWeight: 600 }}>家庭生活服务平台</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button onClick={() => navigate('/services')}>搜索筛选</Button>
          <Button onClick={() => navigate('/orders')}>订单提交</Button>
          <Button onClick={enterDemoAdmin}>后台管理</Button>
          {user ? (
            <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} src={user.avatar} />
                <span>{user.name}</span>
                <Badge dot={user.role === 'admin' || user.role === 'provider'} />
              </div>
            </Dropdown>
          ) : (
            <Button type="primary" onClick={() => navigate('/login')}>登录</Button>
          )}
        </div>
      </Header>
      
      <AntLayout>
        {user && (
          <Sider width={200} style={{ background: '#fff' }}>
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={getMenuItems()}
              onClick={({ key }) => navigate(key)}
              style={{ height: '100%', borderRight: 0 }}
            />
          </Sider>
        )}
        <Content style={{ padding: '24px', background: '#f5f5f5' }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
