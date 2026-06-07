import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Button, Select, message, Tag, Spin, Result } from 'antd';
import {
  HomeOutlined, PlusOutlined, UserOutlined, ShopOutlined,
  LogoutOutlined, SafetyCertificateOutlined, HeartOutlined,
  AuditOutlined, CrownOutlined, BarChartOutlined, FileSearchOutlined,
  KeyOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import HomePage from './pages/Home';
import PostDetailPage from './pages/PostDetail';
import CreatePostPage from './pages/CreatePost';
import ProfilePage from './pages/Profile';
import VerifyPage from './pages/Verify';
import MerchantPage from './pages/Merchant';
import MerchantDetailPage from './pages/MerchantDetail';
import AdminDashboard from './pages/admin/Dashboard';
import AdminReview from './pages/admin/Review';
import AdminMerchants from './pages/admin/MerchantReview';
import AdminAuditLogs from './pages/admin/AuditLogs';
import AdminSensitiveWords from './pages/admin/SensitiveWords';
import DatingMatchPage from './pages/DatingMatch';
import { cityAPI } from './api';

const { Header, Content } = Layout;
const { Option } = Select;

interface User {
  id: number;
  username: string;
  nickname: string;
  is_verified: number;
  is_admin: number;
  role: string;
  city_id: number;
  avatar?: string;
}

const ROLE_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  user: { label: '同城居民', color: 'blue', icon: <HomeOutlined /> },
  merchant: { label: '商户端', color: 'orange', icon: <ShopOutlined /> },
  reviewer: { label: '审核员', color: 'purple', icon: <AuditOutlined /> },
  admin: { label: '城市管理员', color: 'red', icon: <CrownOutlined /> },
};

export const ROLE_HOME: Record<string, string> = {
  user: '/',
  merchant: '/merchants',
  reviewer: '/admin/review',
  admin: '/admin/dashboard',
};

const ADMIN_ROLES = ['admin', 'reviewer'];
const MERCHANT_ROLES = ['merchant', 'admin'];

interface RequireAuthProps {
  children: React.ReactNode;
  user: User | null;
  allowedRoles?: string[];
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children, user, allowedRoles }) => {
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: 48 }}>
        <Result
          status="403"
          title="权限不足"
          subTitle={`当前角色为「${ROLE_LABELS[user.role]?.label || '用户'}」，无法访问此页面`}
          extra={<Button type="primary" onClick={() => window.location.href = ROLE_HOME[user.role] || '/'}>返回首页</Button>}
        />
      </div>
    );
  }
  return <>{children}</>;
};

const RedirectIfAuthenticated: React.FC<{ children: React.ReactNode; user: User | null }> = ({ children, user }) => {
  if (user) {
    const homePath = ROLE_HOME[user.role || 'user'] || '/';
    return <Navigate to={homePath} replace />;
  }
  return <>{children}</>;
};

interface AppLayoutProps {
  user: User | null;
  cities: any[];
  currentCity: { id: number; name: string } | null;
  onCityChange: (id: number) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ user, cities, currentCity, onCityChange, onLogout, children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) {
    return <>{children}</>;
  }

  const role = user.role || 'user';
  const roleConfig = ROLE_LABELS[role];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'role_info',
      label: (
        <div style={{ padding: '4px 0' }}>
          <Tag color={roleConfig?.color} style={{ margin: 0 }}>
            {roleConfig?.icon} {roleConfig?.label}
          </Tag>
          {user?.is_verified ? (
            <Tag color="green" style={{ margin: '0 0 0 4px' }}>已实名</Tag>
          ) : (
            <Tag style={{ margin: '0 0 0 4px' }}>未实名</Tag>
          )}
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    { key: 'profile', icon: <UserOutlined />, label: '个人中心', onClick: () => navigate('/profile') },
    { key: 'verify', icon: <SafetyCertificateOutlined />, label: user?.is_verified ? '实名信息' : '实名认证', onClick: () => navigate('/verify') },
    { key: 'follow', icon: <HeartOutlined />, label: '我的关注', onClick: () => navigate('/profile?tab=following') },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: onLogout },
  ];

  const getNavItems = (): MenuProps['items'] => {
    switch (role) {
      case 'admin':
        return [
          { key: '/admin/dashboard', icon: <BarChartOutlined />, label: '城市运营仪表盘', onClick: () => navigate('/admin/dashboard') },
          { key: '/admin/review', icon: <FileSearchOutlined />, label: '内容审核', onClick: () => navigate('/admin/review') },
          { key: '/admin/merchants', icon: <ShopOutlined />, label: '商户管理', onClick: () => navigate('/admin/merchants') },
          { key: '/admin/sensitive-words', icon: <KeyOutlined />, label: '敏感词管理', onClick: () => navigate('/admin/sensitive-words') },
          { key: '/admin/audit-logs', icon: <AuditOutlined />, label: '审计日志', onClick: () => navigate('/admin/audit-logs') },
          { key: '/', icon: <HomeOutlined />, label: '同城信息流', onClick: () => navigate('/') },
        ];
      case 'reviewer':
        return [
          { key: '/admin/review', icon: <FileSearchOutlined />, label: '内容审核工作台', onClick: () => navigate('/admin/review') },
          { key: '/admin/merchants', icon: <ShopOutlined />, label: '商户资质审核', onClick: () => navigate('/admin/merchants') },
          { key: '/admin/sensitive-words', icon: <KeyOutlined />, label: '敏感词管理', onClick: () => navigate('/admin/sensitive-words') },
          { key: '/admin/audit-logs', icon: <AuditOutlined />, label: '审核日志', onClick: () => navigate('/admin/audit-logs') },
          { key: '/', icon: <HomeOutlined />, label: '同城信息流', onClick: () => navigate('/') },
        ];
      case 'merchant':
        return [
          { key: '/merchants', icon: <ShopOutlined />, label: '商户运营中心', onClick: () => navigate('/merchants') },
          { key: '/', icon: <HomeOutlined />, label: '同城信息流', onClick: () => navigate('/') },
          { key: '/dating', icon: <HeartOutlined />, label: '相亲交友', onClick: () => navigate('/dating/match') },
        ];
      default:
        return [
          { key: '/', icon: <HomeOutlined />, label: '同城信息流', onClick: () => navigate('/') },
          { key: '/merchants', icon: <ShopOutlined />, label: '本地商户', onClick: () => navigate('/merchants') },
          { key: '/dating', icon: <HeartOutlined />, label: '相亲交友', onClick: () => navigate('/dating/match') },
        ];
    }
  };

  return (
    <Layout>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => navigate(ROLE_HOME[role] || '/')}>
            <HomeOutlined style={{ fontSize: 20, color: '#1890ff' }} />
            <span style={{ color: '#1890ff', fontWeight: 600, fontSize: 16 }}>城事通</span>
          </div>
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={getNavItems()}
            style={{ borderBottom: 'none', minWidth: 300 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Select
            value={currentCity?.id}
            onChange={onCityChange}
            placeholder="选择城市"
            style={{ width: 120 }}
          >
            {cities.map((city) => (
              <Option key={city.id} value={city.id}>
                {city.name}
              </Option>
            ))}
          </Select>

          {role === 'user' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/create-post')}>发布</Button>
          )}

          {role === 'merchant' && (
            <Button icon={<PlusOutlined />} onClick={() => navigate('/create-post')}>发布动态</Button>
          )}

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 6 }}>
              <Avatar icon={<UserOutlined />} src={user?.avatar} />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                <span style={{ fontSize: 13 }}>{user?.nickname}</span>
                <Tag color={roleConfig?.color} style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>
                  {roleConfig?.label}
                </Tag>
              </div>
              {user?.is_verified ? <SafetyCertificateOutlined style={{ color: '#52c41a', fontSize: 14 }} /> : null}
            </div>
          </Dropdown>
        </div>
      </Header>

      <Content>{children}</Content>
    </Layout>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentCity, setCurrentCity] = useState<{ id: number; name: string } | null>(null);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadCities = useCallback(async () => {
    try {
      const res = await cityAPI.getCities();
      setCities(res.data.cities);
      const savedCity = localStorage.getItem('currentCity');
      if (savedCity) {
        try {
          const parsed = JSON.parse(savedCity);
          setCurrentCity(parsed);
          return;
        } catch (e) {}
      }
      if (res.data.cities.length > 0) {
        setCurrentCity(res.data.cities[0]);
        localStorage.setItem('currentCity', JSON.stringify(res.data.cities[0]));
      }
    } catch (error: any) {
      console.error('加载城市列表失败', error);
      message.error('城市数据加载失败，请检查后端服务连接');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    loadCities();
  }, [loadCities]);

  const handleLogin = useCallback((u: User, token: string) => {
    setUser(u);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    const homePath = ROLE_HOME[u.role || 'user'] || '/';
    const roleLabel = ROLE_LABELS[u.role || 'user']?.label || '用户';
    message.success(`登录成功！欢迎，${roleLabel}「${u.nickname}」`);
    navigate(homePath, { replace: true });
  }, [navigate]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    message.success('已退出登录');
    navigate('/login', { replace: true });
  }, [navigate]);

  const handleCityChange = useCallback((cityId: number) => {
    const city = cities.find((c) => c.id === cityId);
    if (city) {
      setCurrentCity(city);
      localStorage.setItem('currentCity', JSON.stringify(city));
    }
  }, [cities]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <AppLayout
      user={user}
      cities={cities}
      currentCity={currentCity}
      onCityChange={handleCityChange}
      onLogout={handleLogout}
    >
      <Routes>
        <Route path="/login" element={
          <RedirectIfAuthenticated user={user}>
            <LoginPage onLogin={handleLogin} cities={cities} />
          </RedirectIfAuthenticated>
        } />
        <Route path="/register" element={
          <RedirectIfAuthenticated user={user}>
            <RegisterPage onRegister={handleLogin} />
          </RedirectIfAuthenticated>
        } />
        <Route path="/" element={
          <RequireAuth user={user}>
            <HomePage currentCity={currentCity} />
          </RequireAuth>
        } />
        <Route path="/posts/:id" element={
          <RequireAuth user={user}>
            <PostDetailPage />
          </RequireAuth>
        } />
        <Route path="/create-post" element={
          <RequireAuth user={user}>
            <CreatePostPage currentCity={currentCity} />
          </RequireAuth>
        } />
        <Route path="/profile" element={
          <RequireAuth user={user}>
            <ProfilePage user={user} onUpdate={setUser} />
          </RequireAuth>
        } />
        <Route path="/verify" element={
          <RequireAuth user={user}>
            <VerifyPage onVerified={(u) => {
              setUser(u);
              localStorage.setItem('user', JSON.stringify(u));
            }} />
          </RequireAuth>
        } />
        <Route path="/merchants" element={
          <RequireAuth user={user}>
            <MerchantPage currentCity={currentCity} />
          </RequireAuth>
        } />
        <Route path="/merchants/:id" element={
          <RequireAuth user={user}>
            <MerchantDetailPage />
          </RequireAuth>
        } />
        <Route path="/dating/match" element={
          <RequireAuth user={user}>
            <DatingMatchPage />
          </RequireAuth>
        } />
        <Route path="/admin/dashboard" element={
          <RequireAuth user={user} allowedRoles={ADMIN_ROLES}>
            <AdminDashboard />
          </RequireAuth>
        } />
        <Route path="/admin/review" element={
          <RequireAuth user={user} allowedRoles={ADMIN_ROLES}>
            <AdminReview />
          </RequireAuth>
        } />
        <Route path="/admin/merchants" element={
          <RequireAuth user={user} allowedRoles={ADMIN_ROLES}>
            <AdminMerchants />
          </RequireAuth>
        } />
        <Route path="/admin/audit-logs" element={
          <RequireAuth user={user} allowedRoles={ADMIN_ROLES}>
            <AdminAuditLogs />
          </RequireAuth>
        } />
        <Route path="/admin/sensitive-words" element={
          <RequireAuth user={user} allowedRoles={ADMIN_ROLES}>
            <AdminSensitiveWords />
          </RequireAuth>
        } />
        <Route path="*" element={<Navigate to={user ? (ROLE_HOME[user.role || 'user'] || '/') : '/login'} replace />} />
      </Routes>
    </AppLayout>
  );
};

export default App;
