import React, { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import {
  DatabaseOutlined,
  FileTextOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  AuditOutlined,
  AlertOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CatalogList from './pages/CatalogList';
import CatalogDetail from './pages/CatalogDetail';
import ApplicationList from './pages/ApplicationList';
import ApiCallList from './pages/ApiCallList';
import QualityList from './pages/QualityList';
import AuditList from './pages/AuditList';
import AlertList from './pages/AlertList';

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer }
  } = theme.useToken();

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '数据概览' },
    { key: '/catalogs', icon: <DatabaseOutlined />, label: '数据目录' },
    { key: '/applications', icon: <FileTextOutlined />, label: '申请授权' },
    { key: '/api-calls', icon: <ApiOutlined />, label: '接口交换' },
    { key: '/quality', icon: <CheckCircleOutlined />, label: '数据质量' },
    { key: '/alerts', icon: <AlertOutlined />, label: '安全告警' },
    { key: '/audit', icon: <AuditOutlined />, label: '审计日志' }
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const getSelectedKey = () => {
    if (location.pathname.startsWith('/catalogs/')) return '/catalogs';
    return location.pathname;
  };

  return (
    <Layout>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: collapsed ? 14 : 18, fontWeight: 'bold' }}>
          {collapsed ? '政务' : '数据共享交换平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 18, fontWeight: 500 }}>政务数据共享交换平台</div>
          <div>管理员</div>
        </Header>
        <Content>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/catalogs" element={<CatalogList />} />
            <Route path="/catalogs/:id" element={<CatalogDetail />} />
            <Route path="/applications" element={<ApplicationList />} />
            <Route path="/api-calls" element={<ApiCallList />} />
            <Route path="/quality" element={<QualityList />} />
            <Route path="/alerts" element={<AlertList />} />
            <Route path="/audit" element={<AuditList />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
