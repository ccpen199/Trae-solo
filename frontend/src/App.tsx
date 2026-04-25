import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, theme, Badge } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  WarningOutlined,
  DashboardOutlined,
  SettingOutlined,
  ScheduleOutlined
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import PatientList from './pages/PatientList';
import PatientDetail from './pages/PatientDetail';
import ReportView from './pages/ReportView';
import RiskAlerts from './pages/RiskAlerts';
import PlanManagement from './pages/PlanManagement';

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表盘',
      onClick: () => navigate('/'),
    },
    {
      key: '/patients',
      icon: <UserOutlined />,
      label: '患者管理',
      onClick: () => navigate('/patients'),
    },
    {
      key: '/plans',
      icon: <ScheduleOutlined />,
      label: '计划管理',
      onClick: () => navigate('/plans'),
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: '报告生成',
      onClick: () => navigate('/reports'),
    },
    {
      key: '/alerts',
      icon: (
        <Badge count={3} size="small" offset={[5, -5]}>
          <WarningOutlined />
        </Badge>
      ),
      label: '风险提示',
      onClick: () => navigate('/alerts'),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      onClick: () => navigate('/settings'),
    },
  ];

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/patients/')) return '/patients';
    if (path.startsWith('/plans/')) return '/plans';
    if (path.startsWith('/reports/')) return '/reports';
    return path;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={(value) => setCollapsed(value)}
        theme="dark"
      >
        <div className="logo">
          {collapsed ? '医助' : '医生助理系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <div style={{ 
            padding: '0 24px', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#1f1f1f' }}>
              医生助理康复计划系统
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: '#8c8c8c' }}>欢迎，医生</span>
            </div>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<PatientList />} />
            <Route path="/patients/:id" element={<PatientDetail />} />
            <Route path="/plans" element={<PlanManagement />} />
            <Route path="/reports" element={<ReportView />} />
            <Route path="/reports/:patientId" element={<ReportView />} />
            <Route path="/alerts" element={<RiskAlerts />} />
            <Route
              path="/settings"
              element={
                <div>
                  <h1 className="page-title">系统设置</h1>
                  <p>系统设置功能开发中...</p>
                </div>
              }
            />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
