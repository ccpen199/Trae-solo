import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, theme } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  FileSearchOutlined,
  CalendarOutlined
} from '@ant-design/icons';

const { Header, Content, Sider } = Layout;

function SimpleDashboard() {
  return <h1>Dashboard Works!</h1>;
}

function App() {
  const {
    token: { colorBgContainer }
  } = theme.useToken();
  
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '看板' },
    { key: '/cases', icon: <FileTextOutlined />, label: '案件管理' },
    { key: '/evidences', icon: <FolderOpenOutlined />, label: '证据中心' },
    { key: '/documents', icon: <FileSearchOutlined />, label: '文书流程' },
    { key: '/hearings', icon: <CalendarOutlined />, label: '庭审调解' }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: collapsed ? 14 : 18, fontWeight: 'bold' }}>
          {collapsed ? 'LDZC' : '劳动仲裁系统'}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer, borderBottom: '1px solid #f0f0f0' }}>
          <h2 style={{ marginLeft: 24, lineHeight: '64px' }}>劳动仲裁案件管理系统</h2>
        </Header>
        <Content style={{ margin: '24px', minHeight: 280 }}>
          <Routes>
            <Route path="/" element={<SimpleDashboard />} />
            <Route path="/cases" element={<SimpleDashboard />} />
            <Route path="/cases/:id" element={<SimpleDashboard />} />
            <Route path="/evidences" element={<SimpleDashboard />} />
            <Route path="/documents" element={<SimpleDashboard />} />
            <Route path="/hearings" element={<SimpleDashboard />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
