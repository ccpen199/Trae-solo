import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, theme } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  FolderOpenOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Matters from './pages/Matters';
import TimeEntries from './pages/TimeEntries';
import TimeReview from './pages/TimeReview';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import Reports from './pages/Reports';
import Rates from './pages/Rates';

const { Header, Sider, Content } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  useEffect(() => {
    setCurrentUser({ id: 1, name: '管理员', role: 'admin' });
  }, []);

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: <Link to="/">仪表盘</Link> },
    { key: '/clients', icon: <TeamOutlined />, label: <Link to="/clients">客户管理</Link> },
    { key: '/matters', icon: <FolderOpenOutlined />, label: <Link to="/matters">案件管理</Link> },
    { key: '/time-entries', icon: <ClockCircleOutlined />, label: <Link to="/time-entries">工时填报</Link> },
    { key: '/time-review', icon: <FileTextOutlined />, label: <Link to="/time-review">工时审核</Link> },
    { key: '/invoices', icon: <DollarOutlined />, label: <Link to="/invoices">账单管理</Link> },
    { key: '/rates', icon: <DollarOutlined />, label: <Link to="/rates">费率管理</Link> },
    { key: '/reports', icon: <BarChartOutlined />, label: <Link to="/reports">报表统计</Link> },
  ];

  return (
    <Layout className="layout">
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="logo">{collapsed ? '律' : '律所计费系统'}</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingRight: 24,
          }}
        >
          <div style={{ paddingLeft: 24 }}>
            <span style={{ fontSize: 16, fontWeight: 500 }}>律所计时收费系统</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <UserOutlined />
            <span>{currentUser?.name || '未登录'}</span>
          </div>
        </Header>
        <Content
          style={{
            margin: '16px',
            minHeight: 280,
          }}
        >
          <div className="site-layout-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/matters" element={<Matters />} />
              <Route path="/time-entries" element={<TimeEntries />} />
              <Route path="/time-review" element={<TimeReview />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/:id" element={<InvoiceDetail />} />
              <Route path="/rates" element={<Rates />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
