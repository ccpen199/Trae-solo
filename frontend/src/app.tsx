import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Button, message, Spin } from 'antd';
import {
  FileTextOutlined,
  PlusOutlined,
  SendOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import { useAppStore } from './store';
import { authApi } from './api';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResumeListPage from './pages/ResumeListPage';
import ResumeEditorPage from './pages/ResumeEditorPage';
import TemplateSelectPage from './pages/TemplateSelectPage';
import DeliveryPage from './pages/DeliveryPage';
import QualityPage from './pages/QualityPage';
import AdminDashboard from './pages/AdminDashboard';
import DeliveryTrackPage from './pages/DeliveryTrackPage';

const { Header, Content, Sider } = Layout;

const App: React.FC = () => {
  const { user, token, setUser, logout, isLoading, setLoading } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (token && !user) {
      setLoading(true);
      authApi.getProfile()
        .then((res: any) => {
          setUser(res.user);
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [token, user, setUser, logout, setLoading]);

  if (isLoading && token) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<LoginPage autoAdmin />} />
        <Route path="/admin/*" element={<LoginPage autoAdmin />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/delivery/:trackingCode" element={<DeliveryTrackPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const menuItems = [
    {
      key: '/resumes',
      icon: <FileTextOutlined />,
      label: '我的简历',
      onClick: () => navigate('/resumes')
    },
    {
      key: '/resumes/new',
      icon: <PlusOutlined />,
      label: '新建简历',
      onClick: () => navigate('/templates')
    },
    {
      key: '/delivery',
      icon: <SendOutlined />,
      label: '投递记录',
      onClick: () => navigate('/delivery')
    },
    {
      key: '/quality',
      icon: <BarChartOutlined />,
      label: '质量诊断',
      onClick: () => navigate('/quality')
    },
    ...(user?.is_admin ? [{
      key: '/admin',
      icon: <DashboardOutlined />,
      label: '管理后台',
      onClick: () => navigate('/admin')
    }] : [])
  ];

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: user?.name
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: '账号设置'
      },
      { type: 'divider' as const },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录'
      }
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'logout') {
        logout();
        message.success('已退出登录');
        navigate('/login');
      }
    }
  };

  return (
    <Layout className="layout-container">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        width={220}
        style={{ borderRight: '1px solid #e8e8e8' }}
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', borderBottom: '1px solid #e8e8e8' }}>
          <span style={{ fontSize: collapsed ? 12 : 18, fontWeight: 700, color: '#1a365d' }}>
            {collapsed ? '简历' : '📄 智能简历工作台'}
          </span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ height: '100%', borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ background: 'white', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e8e8e8' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            {location.pathname === '/resumes' && '我的简历'}
            {location.pathname === '/templates' && '选择模板'}
            {location.pathname.startsWith('/resumes/') && location.pathname !== '/resumes/new' && '编辑简历'}
            {location.pathname === '/delivery' && '投递记录'}
            {location.pathname === '/quality' && '简历质量诊断'}
            {location.pathname === '/admin' && '管理后台'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Dropdown menu={userMenu} placement="bottomRight">
              <Button type="text" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} size="small" />
                <span>{user?.name}</span>
              </Button>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ background: '#f0f2f5', minHeight: 'calc(100vh - 64px)', overflowY: 'auto' }}>
          <div className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/resumes" replace />} />
              <Route path="/resumes" element={<ResumeListPage />} />
              <Route path="/templates" element={<TemplateSelectPage />} />
              <Route path="/resumes/:id" element={<ResumeEditorPage />} />
              <Route path="/delivery" element={<DeliveryPage />} />
              <Route path="/quality" element={<QualityPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/delivery/:trackingCode" element={<DeliveryTrackPage />} />
              <Route path="*" element={<Navigate to="/resumes" replace />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
