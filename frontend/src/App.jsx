import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Button, Spin, Result, theme, Alert } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  DollarOutlined,
  BankOutlined,
  SunOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import Login from './pages/Login';
import Home from './pages/Home';
import Farmers from './pages/Farmers';
import Finance from './pages/Finance';
import Village from './pages/Village';
import Sunshine from './pages/Sunshine';
import Admin from './pages/Admin';

const { Header, Sider, Content } = Layout;

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('页面错误:', error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.locationKey !== this.props.locationKey && this.state.hasError) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40 }}>
          <Result
            status="error"
            title="页面加载异常"
            subTitle={this.state.error?.message || '数据处理出现错误，请尝试以下操作'}
            extra={
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button icon={<ReloadOutlined />} onClick={this.resetError}>
                  重置页面状态
                </Button>
                <Button type="primary" onClick={() => window.location.reload()}>
                  刷新页面
                </Button>
              </div>
            }
          />
          {this.state.error && (
            <Alert
              type="info"
              message="错误详情"
              description={
                <div style={{ fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {this.state.error.toString()}
                </div>
              }
              style={{ marginTop: 16, maxWidth: 600, margin: '16px auto' }}
              showIcon
            />
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

const menuItems = [
  { key: '/home', icon: <HomeOutlined />, label: '首页' },
  { key: '/farmers', icon: <UserOutlined />, label: '农户档案' },
  { key: '/finance', icon: <DollarOutlined />, label: '普惠金融' },
  { key: '/village', icon: <BankOutlined />, label: '村务公开' },
  { key: '/sunshine', icon: <SunOutlined />, label: '阳光村务' },
  { key: '/admin', icon: <SettingOutlined />, label: '运营管理' },
];

function AppContent() {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginTrigger, setLoginTrigger] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { token: themeToken } = theme.useToken();

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        setUser({ name: '管理员' });
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [checkAuth, loginTrigger]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const handleLogin = useCallback((userData) => {
    setUser(userData);
    setLoginTrigger(prev => prev + 1);
    setTimeout(() => navigate('/home', { replace: true }), 50);
  }, [navigate]);

  useEffect(() => {
    if (location.pathname === '/login' && user) {
      navigate('/home', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: user.name || '管理员' },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
    ],
    onClick: ({ key }) => {
      if (key === 'logout') handleLogout();
    },
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        onBreakpoint={(broken) => setCollapsed(broken)}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 10,
        }}
      >
        <div style={{
          height: 48,
          margin: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 14 : 16,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}>
          {collapsed ? '数字' : '数字乡村平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        <Header style={{
          padding: '0 16px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 9,
          borderBottom: '1px solid #f0f0f0',
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <span style={{ fontSize: 15, fontWeight: 500, color: '#333' }}>数字乡村综合服务平台</span>
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: themeToken.colorPrimary }} />
              <span style={{ fontSize: 14 }}>{user.name || '管理员'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, minHeight: 280 }}>
          <ErrorBoundary locationKey={location.pathname}>
            <Routes>
              <Route path="/home" element={<Home />} />
              <Route path="/farmers" element={<Farmers />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/village" element={<Village />} />
              <Route path="/sunshine" element={<Sunshine />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </ErrorBoundary>
        </Content>
      </Layout>
    </Layout>
  );
}

export default function App() {
  return <AppContent />;
}
