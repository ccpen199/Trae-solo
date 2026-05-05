import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Button } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { AuthProvider, useAuth } from './store/auth';
import Login from './pages/Login';
import Asset from './pages/Asset';

const { Header, Content, Footer } = Layout;

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
    },
  ];

  const menuItems = [
    {
      key: '/',
      label: <Link to="/">资产管理</Link>,
    },
    {
      key: '/redeem',
      label: <Link to="/redeem">实时赎回</Link>,
    },
    {
      key: '/withdraw',
      label: <Link to="/withdraw">提现</Link>,
    },
    {
      key: '/payment',
      label: <Link to="/payment">支付</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ fontWeight: 'bold', fontSize: 18, marginRight: 48, color: '#1890ff' }}>
          余额宝理财
        </div>
        <Menu mode="horizontal" items={menuItems} style={{ flex: 1, borderBottom: 'none' }} />
        <Dropdown menu={{ items: userMenuItems }}>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar icon={<UserOutlined />} />
            <span>{user?.name || user?.username}</span>
          </div>
        </Dropdown>
      </Header>
      <Content style={{ background: '#f5f5f5' }}>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Asset /></ProtectedRoute>} />
          <Route path="/asset" element={<ProtectedRoute><Asset /></ProtectedRoute>} />
          <Route path="/redeem" element={<ProtectedRoute><Asset /></ProtectedRoute>} />
          <Route path="/withdraw" element={<ProtectedRoute><Asset /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute><Asset /></ProtectedRoute>} />
        </Routes>
      </Content>
      <Footer style={{ textAlign: 'center', background: '#fff' }}>
        余额宝理财系统 ©{new Date().getFullYear()} Created with Trae
      </Footer>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<MainLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
