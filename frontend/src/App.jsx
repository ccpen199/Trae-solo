import React, { useState } from 'react';
import { Layout, Menu, theme, Button, Dropdown, Avatar, Space, Spin } from 'antd';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  DashboardOutlined,
  FileTextOutlined,
  IdcardOutlined,
  AuditOutlined,
  UserOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuth } from './contexts/AuthContext.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Templates from './pages/Templates.jsx';
import Certificates from './pages/Certificates.jsx';
import CertificateDetail from './pages/CertificateDetail.jsx';
import Verification from './pages/Verification.jsx';
import Applicants from './pages/Applicants.jsx';
import Approvals from './pages/Approvals.jsx';
import VerificationLogs from './pages/VerificationLogs.jsx';
import Login from './pages/Login.jsx';

const { Header, Content, Sider } = Layout;

const roleMenus = {
  admin: [
    { key: '/', icon: <DashboardOutlined />, label: '数据概览' },
    { key: '/templates', icon: <FileTextOutlined />, label: '证照模板', permission: 'templates:view' },
    { key: '/approvals', icon: <CheckCircleOutlined />, label: '审批事项', permission: 'approvals:view' },
    { key: '/certificates', icon: <IdcardOutlined />, label: '证照管理', permission: 'certificates:view' },
    { key: '/verification', icon: <AuditOutlined />, label: '证照核验', permission: 'verification:verify' },
    { key: '/verification-logs', icon: <HistoryOutlined />, label: '核验日志', permission: 'verification:view' },
    { key: '/applicants', icon: <UserOutlined />, label: '申请人管理', permission: 'applicants:view' },
  ],
  approver: [
    { key: '/', icon: <DashboardOutlined />, label: '数据概览' },
    { key: '/approvals', icon: <CheckCircleOutlined />, label: '审批事项', permission: 'approvals:view' },
    { key: '/certificates', icon: <IdcardOutlined />, label: '证照管理', permission: 'certificates:view' },
    { key: '/verification', icon: <AuditOutlined />, label: '证照核验', permission: 'verification:verify' },
    { key: '/verification-logs', icon: <HistoryOutlined />, label: '核验日志', permission: 'verification:view' },
  ],
  applicant: [
    { key: '/', icon: <DashboardOutlined />, label: '数据概览' },
    { key: '/approvals', icon: <CheckCircleOutlined />, label: '我的申请', permission: 'approvals:view' },
    { key: '/certificates', icon: <IdcardOutlined />, label: '我的证照', permission: 'certificates:viewOwn' },
  ],
  verifier: [
    { key: '/', icon: <DashboardOutlined />, label: '数据概览' },
    { key: '/verification', icon: <AuditOutlined />, label: '证照核验', permission: 'verification:verify' },
    { key: '/verification-logs', icon: <HistoryOutlined />, label: '核验日志', permission: 'verification:view' },
  ],
};

const roleLabels = {
  admin: '系统管理员',
  approver: '审批人',
  applicant: '申请人',
  verifier: '核验人',
  operator: '操作员',
};

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  if (location.pathname === '/login') {
    return <Login />;
  }

  const menus = roleMenus[user?.role] || roleMenus.applicant;
  const visibleMenus = menus.filter(item => !item.permission || hasPermission(item.permission));
  const menuItems = visibleMenus.map(item => ({
    key: item.key,
    icon: item.icon,
    label: <Link to={item.key}>{item.label}</Link>,
  }));

  const userMenuItems = [
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

  return (
    <ProtectedRoute>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
          <div className="logo">{collapsed ? '证照' : '电子证照管理系统'}</div>
          <Menu
            theme="dark"
            selectedKeys={[location.pathname]}
            mode="inline"
            items={menuItems}
          />
        </Sider>
        <Layout>
          <Header style={{ 
            padding: '0 24px', 
            background: colorBgContainer,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>
                  {user?.username}
                  <span style={{ color: '#999', marginLeft: 8, fontSize: 12 }}>
                    ({roleLabels[user?.role] || user?.role})
                  </span>
                </span>
              </Space>
            </Dropdown>
          </Header>
          <Content style={{ margin: '0 16px' }}>
            <div
              style={{
                padding: 24,
                minHeight: 360,
                background: colorBgContainer,
                borderRadius: borderRadiusLG,
                marginTop: 16,
              }}
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/certificates" element={<Certificates />} />
                <Route path="/certificates/:id" element={<CertificateDetail />} />
                <Route path="/verification" element={<Verification />} />
                <Route path="/verification-logs" element={<VerificationLogs />} />
                <Route path="/applicants" element={<Applicants />} />
                <Route path="/approvals" element={<Approvals />} />
                <Route path="/login" element={<Login />} />
              </Routes>
            </div>
          </Content>
        </Layout>
      </Layout>
    </ProtectedRoute>
  );
}

export default App;
