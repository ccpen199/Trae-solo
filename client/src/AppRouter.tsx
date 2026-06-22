import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { Layout, Menu, Dropdown, Avatar, Badge, Button, notification, theme } from 'antd';
import {
  VideoCameraOutlined, DashboardOutlined, BellOutlined,
  SettingOutlined, UserOutlined, TeamOutlined,
  FileTextOutlined, LogoutOutlined, UserSwitchOutlined,
  ApiOutlined, SafetyOutlined, PlayCircleOutlined,
  MenuUnfoldOutlined, MenuFoldOutlined
} from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import appStore from '@/store';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import DeviceList from '@/pages/DeviceList';
import LivePreview from '@/pages/LivePreview';
import Playback from '@/pages/Playback';
import Alerts from '@/pages/Alerts';
import Settings from '@/pages/Settings';
import Members from '@/pages/Members';
import AuditLogs from '@/pages/AuditLogs';
import TemporaryView from '@/pages/TemporaryView';

const { Header, Sider, Content } = Layout;
const WS_PORT = import.meta.env.VITE_WS_PORT;

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = observer(({ children }) => {
  const navigate = useNavigate();
  useEffect(() => {
    if (!appStore.isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [appStore.isLoggedIn, navigate]);
  if (!appStore.isLoggedIn) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <span>正在跳转登录页...</span>
      </div>
    );
  }
  return <>{children}</>;
});

const LoginRedirect: React.FC = observer(() => {
  const navigate = useNavigate();
  useEffect(() => {
    if (appStore.isLoggedIn) {
      navigate('/dashboard', { replace: true });
    }
  }, [appStore.isLoggedIn, navigate]);
  return <Login />;
});

const RegisterRedirect: React.FC = observer(() => {
  const navigate = useNavigate();
  useEffect(() => {
    if (appStore.isLoggedIn) {
      navigate('/dashboard', { replace: true });
    }
  }, [appStore.isLoggedIn, navigate]);
  return <Register />;
});

const MainLayout: React.FC = observer(() => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const wsRef = useRef<WebSocket | null>(null);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/live',
      icon: <VideoCameraOutlined />,
      label: '实时预览',
    },
    {
      key: '/devices',
      icon: <PlayCircleOutlined />,
      label: '设备管理',
    },
    {
      key: '/playback',
      icon: <FileTextOutlined />,
      label: '录像回放',
    },
    {
      key: '/alerts',
      icon: <BellOutlined />,
      label: (
        <span className="flex items-center">
          告警中心
          {appStore.unreadAlertCount > 0 && (
            <Badge
              count={appStore.unreadAlertCount}
              className="ml-2"
              style={{ backgroundColor: '#ff4d4f' }}
            />
          )}
        </span>
      ),
    },
    ...(appStore.isOwner ? [
      {
        key: '/members',
        icon: <TeamOutlined />,
        label: '成员管理',
      },
      {
        key: '/audit',
        icon: <SafetyOutlined />,
        label: '告警审计',
      },
    ] : []),
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  useEffect(() => {
    appStore.refreshAll();
    const interval = setInterval(() => appStore.refreshAll(), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!appStore.token) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = WS_PORT
      ? `${window.location.hostname}:${WS_PORT}`
      : window.location.host;
    const ws = new WebSocket(`${protocol}//${host}/ws?token=${appStore.token}`);
    wsRef.current = ws;
    let disposed = false;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ai_event') {
          api.warning({
            message: data.title || '智能告警',
            description: `设备: ${data.deviceName} | 类型: ${data.eventType}`,
            duration: 8,
            onClick: () => navigate('/alerts'),
          });
          appStore.loadUnreadAlerts();
        } else if (data.type === 'device_status') {
          appStore.loadStatistics();
        }
      } catch (e) {}
    };

    ws.addEventListener('open', () => {
      if (disposed) {
        ws.close();
      }
    }, { once: true });

    return () => {
      disposed = true;
      wsRef.current = null;
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [appStore.token]);

  const userMenu = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/settings'),
    },
    ...(appStore.isOwner ? [{
      key: 'devices',
      icon: <ApiOutlined />,
      label: '设备绑定',
      onClick: () => navigate('/devices'),
    }] : []),
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: () => appStore.logout(),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {contextHolder}
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark" width={220}>
        <div className="h-16 flex items-center justify-center text-white text-lg font-bold border-b border-gray-700">
          {collapsed ? '监控' : '视频监控平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header className="bg-white px-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="!mr-4"
            />
            <div className="text-gray-600">
              {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/alerts">
              <Badge count={appStore.unreadAlertCount} size="small">
                <BellOutlined className="text-xl text-gray-600 cursor-pointer hover:text-blue-600" />
              </Badge>
            </Link>
            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded">
                <Avatar size="small" icon={<UserOutlined />} src={appStore.user?.avatar} />
                <span className="text-gray-700">
                  {appStore.user?.nickname || appStore.user?.username}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  appStore.user?.role === 'owner' ? 'bg-purple-100 text-purple-700' :
                  appStore.user?.role === 'member' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {appStore.user?.role === 'owner' ? '主账号' :
                   appStore.user?.role === 'member' ? '家庭成员' : '访客'}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="p-6 bg-gray-50 overflow-auto">
          <Routes>
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/devices" element={<ProtectedRoute><DeviceList /></ProtectedRoute>} />
            <Route path="/live" element={<ProtectedRoute><LivePreview /></ProtectedRoute>} />
            <Route path="/playback" element={<ProtectedRoute><Playback /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
            <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
            <Route path="/audit" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
});

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<LoginRedirect />} />
        <Route path="/register" element={<RegisterRedirect />} />
        <Route path="/temp-view" element={<TemporaryView />} />
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
