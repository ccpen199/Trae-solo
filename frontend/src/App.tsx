import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, Tag, Space, Typography } from 'antd';
import {
  DashboardOutlined,
  BookOutlined,
  FileTextOutlined,
  UserOutlined,
  SafetyOutlined,
  AlertOutlined,
  FileProtectOutlined,
  BarChartOutlined,
  HistoryOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DownOutlined,
} from '@ant-design/icons';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CourseList from './pages/courses/CourseList';
import CourseDetail from './pages/courses/CourseDetail';
import MaterialList from './pages/materials/MaterialList';
import MaterialDetail from './pages/materials/MaterialDetail';
import LecturerList from './pages/lecturers/LecturerList';
import PublicationReview from './pages/publication/PublicationReview';
import PiracyClueList from './pages/piracy/PiracyClueList';
import PiracyClueDetail from './pages/piracy/PiracyClueDetail';
import EnforcementCaseList from './pages/enforcement/EnforcementCaseList';
import EnforcementCaseDetail from './pages/enforcement/EnforcementCaseDetail';
import Reports from './pages/reports/Reports';
import AuditLog from './pages/audit/AuditLog';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const roleMap: Record<string, string> = {
  admin: '系统管理员',
  operation: '运营专员',
  lecturer: '讲师',
  legal: '法务专员',
  customer_service: '客服专员',
};

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
  { key: '/courses', icon: <BookOutlined />, label: '课程管理' },
  { key: '/materials', icon: <FileTextOutlined />, label: '素材库管理' },
  { key: '/lecturers', icon: <UserOutlined />, label: '讲师管理' },
  { key: '/publication', icon: <SafetyOutlined />, label: '上架检查' },
  { key: '/piracy', icon: <AlertOutlined />, label: '盗版线索' },
  { key: '/enforcement', icon: <FileProtectOutlined />, label: '维权流程' },
  { key: '/reports', icon: <BarChartOutlined />, label: '版权报表' },
  { key: '/audit', icon: <HistoryOutlined />, label: '操作日志', roles: ['admin'] },
];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        setUser(JSON.parse(userStr));
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {}
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f0f2f5',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, color: '#1677ff', marginBottom: 16 }}>
            版权保护管理系统
          </div>
          <div style={{ color: '#8c8c8c' }}>加载中...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const filteredMenu = menuItems.filter((item) => {
    if (item.roles && user) {
      return item.roles.includes(user.role);
    }
    return true;
  });

  const selectedKey = menuItems.find((item) =>
    location.pathname.startsWith(item.key)
  )?.key || '/dashboard';

  const userMenuItems = [
    {
      key: 'user-info',
      label: (
        <div style={{ padding: 8 }}>
          <div style={{ fontWeight: 500, fontSize: 14 }}>{user?.name || '用户'}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{roleMap[user?.role] || user?.role}</div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={220}
        collapsedWidth={80}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 14 : 16,
            fontWeight: 'bold',
            background: '#000c17',
          }}
        >
          {collapsed ? 'CP' : '版权管控系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={filteredMenu.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
          }))}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
            height: 64,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
            <Title level={4} style={{ margin: 0, color: '#1f1f1f' }}>
              课程版权管控工作台
            </Title>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {user && (
              <Tag color="blue">{roleMap[user.role]}</Tag>
            )}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar style={{ backgroundColor: '#1677ff' }}>
                  <UserOutlined />
                </Avatar>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 14, color: '#1f1f1f' }}>{user?.name || '用户'}</div>
                </div>
                <DownOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ padding: '24px', background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/courses" element={<CourseList />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/materials" element={<MaterialList />} />
            <Route path="/materials/:id" element={<MaterialDetail />} />
            <Route path="/lecturers" element={<LecturerList />} />
            <Route path="/publication" element={<PublicationReview />} />
            <Route path="/piracy" element={<PiracyClueList />} />
            <Route path="/piracy/:id" element={<PiracyClueDetail />} />
            <Route path="/enforcement" element={<EnforcementCaseList />} />
            <Route path="/enforcement/:id" element={<EnforcementCaseDetail />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit" element={<AuditLog />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
