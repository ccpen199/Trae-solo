import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, message } from 'antd';
import { 
  DashboardOutlined, 
  AppstoreOutlined, 
  ThunderboltOutlined, 
  FileTextOutlined, 
  WarningOutlined, 
  SafetyOutlined, 
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import CallLogs from './pages/CallLogs';
import ChangeOrders from './pages/ChangeOrders';
import Alerts from './pages/Alerts';
import AlertDetail from './pages/AlertDetail';
import AuditLogs from './pages/AuditLogs';

const { Header, Sider, Content } = Layout;

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    message.success('已退出登录');
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
    { key: '/applications', icon: <AppstoreOutlined />, label: '应用管理' },
    { key: '/tasks', icon: <ThunderboltOutlined />, label: '执行任务' },
    { key: '/call-logs', icon: <HistoryOutlined />, label: '调用日志' },
    { key: '/change-orders', icon: <FileTextOutlined />, label: '变更单' },
    { key: '/alerts', icon: <WarningOutlined />, label: '告警记录' },
    { key: '/audit-logs', icon: <SafetyOutlined />, label: '权限审计' },
  ];

  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={(u) => setUser(u)} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="app-logo">SDK 管理后台</div>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Button type="text" className="app-user" icon={<UserOutlined />}>
            {user.name}
          </Button>
        </Dropdown>
      </Header>
      <Layout>
        <Sider className="app-sider" width={200}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            theme="dark"
          />
        </Sider>
        <Layout style={{ padding: '0' }}>
          <Content className="app-content">
            <Routes>
              <Route path="/login" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/applications/:id" element={<ApplicationDetail />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/tasks/:id" element={<TaskDetail />} />
              <Route path="/call-logs" element={<CallLogs />} />
              <Route path="/change-orders" element={<ChangeOrders />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/alerts/:id" element={<AlertDetail />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default App;
